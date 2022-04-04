import tls from 'tls';
import { PassThrough } from 'stream';

import { EmailTest, Email } from 'meteor/email';
import { Mongo } from 'meteor/mongo';
import { HTTP } from 'meteor/http';

if (!process.env.USE_NATIVE_OPLOG) {
	Package['disable-oplog'] = {};
}

// Set default HTTP call timeout to 20s
const envTimeout = parseInt(process.env.HTTP_DEFAULT_TIMEOUT, 10);
const timeout = !isNaN(envTimeout) ? envTimeout : 20000;

const { call } = HTTP;
HTTP.call = function _call(method, url, options = {}, callback) {
	const defaultTimeout = 'timeout' in options ? options : { ...options, timeout };

	return call.call(HTTP, method, url, defaultTimeout, callback);
};

// FIX For TLS error see more here https://github.com/RocketChat/Rocket.Chat/issues/9316
// TODO: Remove after NodeJS fix it, more information
// https://github.com/nodejs/node/issues/16196
// https://github.com/nodejs/node/pull/16853
// This is fixed in Node 10, but this supports LTS versions
tls.DEFAULT_ECDH_CURVE = 'auto';

const mongoConnectionOptions = {
	// add retryWrites=false if not present in MONGO_URL
	...(!process.env.MONGO_URL.includes('retryWrites') && { retryWrites: false }),
	// ignoreUndefined: false, // TODO evaluate adding this config
};

const mongoOptionStr = process.env.MONGO_OPTIONS;
if (typeof mongoOptionStr !== 'undefined') {
	const mongoOptions = JSON.parse(mongoOptionStr);
	Object.assign(mongoConnectionOptions, mongoOptions);
}

if (Object.keys(mongoConnectionOptions).length > 0) {
	Mongo.setConnectionOptions(mongoConnectionOptions);
}

process.env.HTTP_FORWARDED_COUNT = process.env.HTTP_FORWARDED_COUNT || '1';

// Send emails to a "fake" stream instead of print them in console
if (process.env.NODE_ENV !== 'development') {
	const stream = new PassThrough();
	EmailTest.overrideOutputStream(stream);
	stream.on('data', () => {});
	stream.on('end', () => {});
}

// Just print to logs if in TEST_MODE due to a bug in Meteor 2.5: TypeError: Cannot read property '_syncSendMail' of null
if (process.env.TEST_MODE === 'true') {
	Email.send = function _send(options) {
		console.log('Email.send', options);
	};
}
