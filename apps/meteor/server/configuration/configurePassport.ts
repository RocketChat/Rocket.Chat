import { Users } from '@rocket.chat/models';
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

export const configurePassport = (settings: ICachedSettings) => {
	oAuthRouter.use(
		session({
			name: 'oauth',
			secret: settings.get<string>('Accounts_OAuth_Session_Secret'),
			resave: false,
			saveUninitialized: false,
			proxy: true,
			cookie: {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				maxAge: 5 * 60 * 1000, // 5 minutes
				sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			},
		}),
	);

	oAuthRouter.use(passport.initialize());
	oAuthRouter.use(passport.session());
	oAuthRouter.use(flash());
	oAuthRouter.use(bodyParser.urlencoded({ extended: true }));

	passport.serializeUser((user: any, done) => {
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
