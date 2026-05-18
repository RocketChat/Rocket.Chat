import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import bodyParser from 'body-parser';
import express from 'express';
import flash from 'express-flash';
import session from 'express-session';
import { WebApp } from 'meteor/webapp';
import passport from 'passport';

import type { ICachedSettings } from '../../app/settings/server/CachedSettings';
import { configureOAuthServices } from '../lib/oauth/configureOAuthServices';
import { createOAuthServiceConfig } from '../lib/oauth/createOAuthServiceConfig';
import { getOAuthServices } from '../lib/oauth/getOAuthServices';

export const oAuthRouter = express();

oAuthRouter.enable('trust proxy');
oAuthRouter.set('trust proxy', true);

oAuthRouter.use(
	session({
		name: 'oauth',
		secret: Random.secret(),
		resave: false,
		saveUninitialized: true,
		proxy: true,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			// secure: true,
			maxAge: 5 * 60 * 1000, // 5 minutes
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		},
	}),
);

oAuthRouter.use(passport.initialize());
oAuthRouter.use(passport.session());
oAuthRouter.use(flash());
oAuthRouter.use(bodyParser.urlencoded({ extended: true }));

export const configurePassport = (settings: ICachedSettings) => {
	passport.serializeUser((user: any, done) => {
		// done(null, user);
		done(null, user._id);
	});

	passport.deserializeUser(async (id, done) => {
		const user = await Users.findOneById(id as string);
		// we don’t actually use this user later
		done(null, user);
	});

	settings.watchByRegex(/^(Accounts_OAuth_)[a-z0-9_]+$/i, () => {
		const services = getOAuthServices(settings);
		const oauthServiceConfigs = createOAuthServiceConfig(settings, services);
		configureOAuthServices(oauthServiceConfigs, settings);
	});

	WebApp.rawConnectHandlers.use(oAuthRouter);
};
