/*
- localhost:3000/_oauth/facebook
- get the URI that this request comes from
- set it as redirectUrl
- do things
- add ?access_token= and ?service= to the URL
- redirect to it
*/

/*app.get(`${GRANT_PATH}/google/callback`, function (req, res) {
	const accessToken = req.query.access_token;
  res.redirect(`${STATIC_SERVER}/login?service=google&access_token=${accessToken}`);
});*/

import { WebApp } from 'meteor/webapp';
import session from 'express-session';
import Grant from 'grant-express';
import fiber from 'fibers';

import { generateConfig, path } from './grant';
import { middleware } from './redirect';

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
		middleware(req, res, next);
	}).run();
});

Meteor.startup(() => {
	const config = generateConfig();

	grant = new Grant(config);
});


