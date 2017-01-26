/* eslint-disable max-lines, no-magic-numbers */
/* eslint-env mocha */
const parser = require( "./parser" );
const data = require( "./parser.spec.json" );
const { assert } = testHelpers;

describe( "topologyParser", () => {
	let topology;

	context( "parsing exchanges separately", () => {
		beforeEach( () => {
			topology = parser( data[ "exchanges-only" ] );
		} );

		it( "should parse all exchanges defined", () => {
			assert.deepEqual( topology.exchanges, {
				"defined.exchange": {
					name: "defined.exchange",
					type: "fanout",
					durable: true,
					internal: true,
					autoDelete: true,
					alternateExchange: "alternate.exchange",
					arguments: {
						custom: "value"
					}
				}
			} );
		} );

		it( "should not contain any extra properties", () => {
			assert.notProperty( topology.exchanges[ "defined.exchange" ], "unsupported" );
		} );
	} );

	context( "parsing queues separately", () => {
		beforeEach( () => {
			topology = parser( data[ "queues-only" ] );
		} );

		it( "should parse the normal queue definition", () => {
			assert.deepEqual( topology.queues[ "defined.queue" ], {
				name: "defined.queue",
				exclusive: true,
				durable: true,
				autoDelete: true,
				expires: 600,
				maxLength: 100,
				maxPriority: 1,
				messageTtl: 500,
				arguments: {
					custom: "value"
				}
			} );
		} );

		it( "should parse the dead-letter queue definition", () => {
			assert.deepEqual( topology.queues[ "deadletter.queue" ], {
				name: "deadletter.queue",
				deadLetterExchange: "dlx",
				deadLetterRoutingKey: "#"
			} );
		} );

		it( "should not parse any extra properties", () => {
			assert.notProperty( topology.queues[ "defined.queue" ], "unsupported" );
		} );
	} );

	context( "parsing bindings separately", () => {
		beforeEach( () => {
			topology = parser( data[ "bindings-only" ] );
		} );

		it( "should parse the queue binding", () => {
			assert.lengthOf( topology.bindings.queues, 2 );
			assert.deepEqual( topology.bindings.queues[ 0 ], {
				exchange: "target.exchange",
				target: "target.queue",
				pattern: "#"
			} );
			assert.deepEqual( topology.bindings.queues[ 1 ], {
				exchange: "target.exchange",
				target: "target.queue",
				pattern: "*.message"
			} );
		} );

		it( "should parse the exchange binding", () => {
			assert.lengthOf( topology.bindings.exchanges, 1 );
			assert.deepEqual( topology.bindings.exchanges[ 0 ], {
				exchange: "target.exchange",
				target: "target.exchange.topic",
				pattern: ""
			} );
		} );
	} );

	context( "parsing embedded alternate exchanges", () => {
		beforeEach( () => {
			topology = parser( data[ "embedded-alt-exchange" ] );
		} );

		it( "should create the alternate exchange", () => {
			assert.deepEqual( topology.exchanges[ "alternate.exchange" ], {
				name: "alternate.exchange",
				type: "fanout",
				durable: true,
				autoDelete: false
			} );
		} );
	} );

	context( "parsing embedded dead letter exchanges", () => {
		beforeEach( () => {
			topology = parser( data[ "embedded-deadletter-exchange" ] );
		} );

		it( "should create the dead-letter exchange", () => {
			assert.deepEqual( topology.exchanges[ "defined.dlx" ], {
				name: "defined.dlx",
				type: "fanout"
			} );
		} );
	} );

	context( "parsing embedded queue bindings", () => {
		beforeEach( () => {
			topology = parser( data[ "embedded-queue-bindings" ] );
		} );

		it( "should create the embedded queue from the binding", () => {
			assert.deepProperty( topology.queues, "defined\\.queue" );
			assert.deepEqual( topology.queues[ "defined.queue" ], {
				name: "defined.queue",
				durable: true,
				deadLetterExchange: "defined.dlx",
				deadLetterRoutingKey: undefined
			} );
		} );

		it( "should create the embedded dead-letter exchange", () => {
			assert.deepProperty( topology.exchanges, "defined\\.dlx" );
			assert.deepEqual( topology.exchanges[ "defined.dlx" ], {
				name: "defined.dlx",
				type: "fanout"
			} );
		} );

		it( "should create the queue binding", () => {
			assert.deepEqual( topology.bindings.queues[ 0 ], {
				exchange: "defined.exchange",
				target: "defined.queue",
				pattern: "*.message"
			} );
		} );
	} );

	context( "parsing embedded exchange bindings", () => {
		beforeEach( () => {
			topology = parser( data[ "embedded-exchange-bindings" ] );
		} );

		it( "should create the embedded exchange from the binding", () => {
			assert.deepProperty( topology.exchanges, "defined\\.exchange\\.topic" );
			assert.deepEqual( topology.exchanges[ "defined.exchange.topic" ], {
				name: "defined.exchange.topic",
				type: "topic",
				durable: true
			} );
		} );

		it( "should create the exchange binding", () => {
			assert.deepEqual( topology.bindings.exchanges[ 0 ], {
				exchange: "defined.exchange",
				target: "defined.exchange.topic",
				pattern: "#"
			} );
		} );
	} );

	context( "parsing subscriptions", () => {
		beforeEach( () => {
			topology = parser( data.subscriptions );
		} );

		it( "should create the subscription exchange", () => {
			assert.deepProperty( topology.exchanges, "subscription\\.exchange" );
			assert.deepEqual( topology.exchanges[ "subscription.exchange" ], {
				name: "subscription.exchange",
				type: "fanout"
			} );
		} );

		it( "should create the topic exchange", () => {
			assert.deepProperty( topology.exchanges, "topic\\.exchange" );
			assert.deepEqual( topology.exchanges[ "topic.exchange" ], {
				name: "topic.exchange",
				type: "topic"
			} );
		} );

		it( "should create the exchange bindings", () => {
			assert.deepEqual( topology.bindings.exchanges[ 0 ], {
				exchange: "topic.exchange",
				target: "subscription.exchange",
				pattern: "*.one"
			} );
			assert.deepEqual( topology.bindings.exchanges[ 1 ], {
				exchange: "topic.exchange",
				target: "subscription.exchange",
				pattern: "*.two"
			} );
		} );
	} );

	context( "parsing subscriptions with embedded exchanges", () => {
		beforeEach( () => {
			topology = parser( data[ "embedded-subscriptions" ] );
		} );

		it( "should create the subscription exchange", () => {
			assert.deepProperty( topology.exchanges, "subscription\\.exchange" );
			assert.deepEqual( topology.exchanges[ "subscription.exchange" ], {
				name: "subscription.exchange",
				type: "fanout"
			} );
		} );

		it( "should create the topic exchange", () => {
			assert.deepProperty( topology.exchanges, "topic\\.one" );
			assert.deepEqual( topology.exchanges[ "topic.one" ], {
				name: "topic.one",
				type: "topic"
			} );
		} );

		it( "should create the exchange bindings", () => {
			assert.deepEqual( topology.bindings.exchanges[ 0 ], {
				exchange: "topic.one",
				target: "subscription.exchange",
				pattern: "*.one"
			} );
			assert.deepEqual( topology.bindings.exchanges[ 1 ], {
				exchange: "topic.one",
				target: "subscription.exchange",
				pattern: "*.two"
			} );
		} );
	} );

	context( "named primitives", () => {
		beforeEach( () => {
			topology = parser( data[ "named-primitives" ] );
		} );

		it( "should create an index-named queue", () => {
			assert.deepProperty( topology.queues, "delivery" );
			assert.deepEqual( topology.queues.delivery, { name: "defined.queue" } );
		} );

		it( "should create an index-named exchange", () => {
			assert.deepProperty( topology.exchanges, "subscription" );
			assert.deepEqual( topology.exchanges.subscription, { name: "defined.exchange", type: "topic" } );
		} );

		it( "should create an index-named nested exchange", () => {
			assert.deepProperty( topology.exchanges, "nested" );
			assert.deepEqual( topology.exchanges.nested, { name: "nested.exchange", type: "fanout" } );
		} );

		it( "should create an index-named queue for the embedded queue", () => {
			assert.deepProperty( topology.queues, "ingress" );
			assert.deepEqual( topology.queues.ingress, { name: "ingress.queue" } );
		} );

		it( "should create an index-named queue for the embedded simple queue", () => {
			assert.deepProperty( topology.queues, "simple" );
			assert.deepEqual( topology.queues.simple, { name: "simple.queue" } );
		} );
	} );
} );
