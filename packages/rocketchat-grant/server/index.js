import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import session from 'express-session';
import SessionStorage from 'connect-mongodb-session';
import Grant from 'grant-express';
import fiber from 'fibers';

import { GrantError } from './error';
import { generateConfig } from './grant';
import { path, generateCallback, generateAppCallback } from './routes';
import { middleware as redirect } from './redirect';
import Providers, { middleware as providers } from './providers';
import Settings from './settings';

let grant;
let storeAddress = process.env.SESSIONS_URL || 'mongodb://localhost:27017/rocketsession';

if (storeAddress.indexOf('connectTimeoutMS=') < 0) {
	if (storeAddress.indexOf('?') < 0) {
		storeAddress += '?connectTimeoutMS=1200';
	} else {
		storeAddress += '&connectTimeoutMS=1200';
	}
}
const store = new SessionStorage({
	collection: process.env.SESSION_COLLECTION || 'mySessions',
	databaseName: process.env.SESSION_DATABASE || 'connect_mongodb_session',
	uri: storeAddress,
}, ((e) => {
	throw new GrantError('Sessions storage initialization failure:', e);
}));

store.on('error', (e) => {
	throw new GrantError('Sessions storage error caught:', e);
});

WebApp.connectHandlers.use(session({
	secret: 'grant',
	store,
	resave: true,
	saveUninitialized: true,
}));

// grant
WebApp.connectHandlers.use(path, (req, res, next) => {
	if (grant) {
		grant(req, res, next);
	} else {
		next();
	}
});

// callbacks
WebApp.connectHandlers.use((req, res, next) => {
	fiber(() => {
		redirect(req, res, next);
	}).run();
});

// providers
WebApp.connectHandlers.use((req, res, next) => {
	fiber(() => {
		providers(req, res, next);
	}).run();
});

Meteor.startup(() => {
	const config = generateConfig();

	grant = new Grant(config);
});

export {
	path,
	generateCallback,
	generateAppCallback,
	Providers,
	Settings,
	GrantError,
};
