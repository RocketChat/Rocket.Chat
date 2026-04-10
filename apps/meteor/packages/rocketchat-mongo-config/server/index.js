import tls from 'tls';
import { PassThrough } from 'stream';
import { Collection } from 'mongodb';

import { Email } from 'meteor/email';
import { Mongo } from 'meteor/mongo';

// DocumentDB only supports one index build at a time per collection.
// Serialize all createIndex/createIndexes calls per collection at the native
// driver level so Meteor packages (accounts-base, accounts-password, etc.)
// and Rocket.Chat models (BaseRaw) don't race against each other.
// This package loads before accounts-base (see .meteor/packages order).
if (process.env.DOCUMENTDB === 'true') {
	const PATCHED = Symbol.for('rocketchat.documentdb.index.patch');

	if (!Collection[PATCHED]) {
		Collection[PATCHED] = true;

		const queues = new Map();

		const enqueue = (collectionName, fn) => {
			const prev = queues.get(collectionName) || Promise.resolve();
			const next = prev.then(fn, fn);
			queues.set(collectionName, next.catch(() => {}));
			return next;
		};

		const originalCreateIndex = Collection.prototype.createIndex;
		Collection.prototype.createIndex = function (...args) {
			return enqueue(this.collectionName, () => originalCreateIndex.apply(this, args));
		};

		const originalCreateIndexes = Collection.prototype.createIndexes;
		Collection.prototype.createIndexes = function (...args) {
			return enqueue(this.collectionName, () => originalCreateIndexes.apply(this, args));
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
