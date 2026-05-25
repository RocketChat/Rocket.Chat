import tls from 'tls';
import { PassThrough } from 'stream';

import { Email } from 'meteor/email';
import { Mongo } from 'meteor/mongo';
import { MongoInternals } from 'meteor/mongo';

// DocumentDB only supports one index build at a time per collection.
// Serialize every index-creating call path so Meteor packages (accounts-base,
// accounts-password, accounts-oauth) and Rocket.Chat models (BaseRaw) don't
// race against each other on the same collection. This package loads before
// accounts-base (position 53 vs 56 in .meteor/packages).
//
// We patch Collection.prototype.{createIndex,createIndexes} on Meteor's bundled
// mongodb driver. Meteor's MongoConnection.createIndexAsync internally goes
// through `this.rawCollection(name).createIndex(...)`, and BaseRaw reaches the
// same Collection via `MongoInternals.defaultRemoteCollectionDriver().mongo.db
// .collection(n)`, so a single Collection-level hook covers both entry points.
//
// @rocket.chat/models/src/patchIndex.ts does the equivalent patch on the app's
// node_modules/mongodb (a separate module instance that Meteor does not share),
// and both patches use the same queue via a globalThis-keyed Map so per-
// collection builds serialize across every code path.
//
// Do NOT also wrap MongoConnection.createIndexAsync: doing so double-enqueues
// — the outer wrapper awaits the inner enqueue, which is queued AFTER the
// outer promise, producing a deadlock and an unhealthy container on startup.
if (process.env.DOCUMENTDB === 'true') {
	const QUEUE_KEY = Symbol.for('rocketchat.documentdb.index.queues');
	// Must match the symbol used by @rocket.chat/models/src/patchIndex.ts so
	// that if both modules resolve to the same Collection class (possible inside
	// the Meteor bundle) only the first patch wraps createIndex; the second is
	// a no-op. A mismatch causes double-wrapping → double-enqueue → deadlock.
	const PATCHED_KEY = Symbol.for('rocketchat.documentdb.index.patch');
	if (!globalThis[QUEUE_KEY]) {
		globalThis[QUEUE_KEY] = new Map();
	}
	const queues = globalThis[QUEUE_KEY];

	const enqueue = (collectionName, fn) => {
		const prev = queues.get(collectionName) || Promise.resolve();
		const next = prev.then(fn, fn);
		queues.set(collectionName, next.catch(() => {}));
		return next;
	};

	const mongo = MongoInternals.defaultRemoteCollectionDriver().mongo;

	// Probe collection is the simplest way to reach the prototype — Meteor does
	// not expose it directly. No IO: db.collection(name) is lazy.
	const probeCollection = mongo.rawCollection('___documentdb_index_patch_probe___');
	const CollectionProto = Object.getPrototypeOf(probeCollection);
	if (CollectionProto && !CollectionProto[PATCHED_KEY]) {
		CollectionProto[PATCHED_KEY] = true;

		const originalProtoCreateIndex = CollectionProto.createIndex;
		CollectionProto.createIndex = function (...args) {
			return enqueue(this.collectionName, () => originalProtoCreateIndex.apply(this, args));
		};

		const originalProtoCreateIndexes = CollectionProto.createIndexes;
		CollectionProto.createIndexes = function (...args) {
			return enqueue(this.collectionName, () => originalProtoCreateIndexes.apply(this, args));
		};
	}
}

// we always want Meteor to disable oplog tailing
Package['disable-oplog'] = {};

// FIX For TLS error see more here https://github.com/RocketChat/Rocket.Chat/issues/9316
// TODO: Remove after NodeJS fix it, more information
// https://github.com/nodejs/node/issues/16196
// https://github.com/nodejs/node/pull/16853
// This is fixed in Node 10, but this supports LTS versions
tls.DEFAULT_ECDH_CURVE = 'auto';

const mongoConnectionOptions = {
	// add retryWrites=false if not present in MONGO_URL
	...(!process.env.MONGO_URL.includes('retryWrites') && { retryWrites: false }),
	ignoreUndefined: false,

	// TODO ideally we should call isTracingEnabled(), but since this is a Meteor package we can't :/
	monitorCommands: ['yes', 'true'].includes(String(process.env.TRACING_ENABLED).toLowerCase()),
};

const mongoOptionStr = process.env.MONGO_OPTIONS;
if (typeof mongoOptionStr !== 'undefined') {
	try {
		const mongoOptions = JSON.parse(mongoOptionStr);
		Object.assign(mongoConnectionOptions, mongoOptions);
	} catch (error) {
		throw new Error('Invalid MONGO_OPTIONS environment variable: must be valid JSON.', { cause: error });
	}
}

if (Object.keys(mongoConnectionOptions).length > 0) {
	Mongo.setConnectionOptions(mongoConnectionOptions);
}

process.env.HTTP_FORWARDED_COUNT = process.env.HTTP_FORWARDED_COUNT || '1';

// Just print to logs if in TEST_MODE due to a bug in Meteor 2.5: TypeError: Cannot read property '_syncSendMail' of null
if (process.env.TEST_MODE === 'true') {
	Email.sendAsync = async function _sendAsync(options) {
		console.log('Email.sendAsync', options);
	};
} else if (process.env.NODE_ENV !== 'development') {
	// Send emails to a "fake" stream instead of print them in console in case MAIL_URL or SMTP is not configured
	const stream = new PassThrough();
	stream.on('data', () => {});
	stream.on('end', () => {});

	const { sendAsync } = Email;
	Email.sendAsync = function _sendAsync(options) {
		return sendAsync.call(this, { stream, ...options });
	};
}
