import { Mongo } from 'meteor/mongo';

import tls from 'tls';
// FIX For TLS error see more here https://github.com/RocketChat/Rocket.Chat/issues/9316
// TODO: Remove after NodeJS fix it, more information https://github.com/nodejs/node/issues/16196 https://github.com/nodejs/node/pull/16853
tls.DEFAULT_ECDH_CURVE = 'auto';

// Revert change from Meteor 1.6.1 who set ignoreUndefined: true
// more information https://github.com/meteor/meteor/pull/9444
let mongoOptions = {
	ignoreUndefined: false,
};

const mongoOptionStr = process.env.MONGO_OPTIONS;
if (typeof mongoOptionStr !== 'undefined') {
	const jsonMongoOptions = JSON.parse(mongoOptionStr);

	mongoOptions = Object.assign({}, mongoOptions, jsonMongoOptions);
}

Mongo.setConnectionOptions(mongoOptions);
