import { WebApp } from 'meteor/webapp';
import session from 'express-session';
import Grant from 'grant-express';
import fiber from 'fibers';

import { GrantError } from './error';
import { generateConfig } from './grant';
import { path, generateCallback, generateAppCallback } from './routes';
import { middleware as redirect } from './redirect';
import Providers, { middleware as providers } from './providers';
import Settings from './settings';

let grant;

WebApp.connectHandlers.use(session({
	secret: 'grant',
	resave: true,
	saveUninitialized: true
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
	GrantError
};
