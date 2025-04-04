import tls from 'tls';
import { PassThrough } from 'stream';

import { Email } from 'meteor/email';
import { Mongo } from 'meteor/mongo';

const shouldUseNativeOplog = ['yes', 'true'].includes(String(process.env.USE_NATIVE_OPLOG).toLowerCase());
if (!shouldUseNativeOplog) {
	Package['disable-oplog'] = {};
}

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
	const mongoOptions = JSON.parse(mongoOptionStr);
	Object.assign(mongoConnectionOptions, mongoOptions);
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
