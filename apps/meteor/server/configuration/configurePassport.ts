import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import express from 'express';
import session from 'express-session';
import { WebApp } from 'meteor/webapp';
import passport from 'passport';

import type { ICachedSettings } from '../../app/settings/server/CachedSettings';
import { configureOAuthServices } from '../lib/oauth/configureOAuthServices';
import { createOAuthServiceConfig } from '../lib/oauth/createOAuthServiceConfig';
import { getOAuthServices } from '../lib/oauth/getOAuthServices';

const logger = new Logger('configurePassport');

export const oAuthRouter = express();

oAuthRouter.use(
	session({
		name: 'oauth',
		secret: Random.secret(),
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 5 * 60 * 1000, // 5 minutes
		},
	}),
);

oAuthRouter.use(passport.initialize());
oAuthRouter.use(passport.session());

export const configurePassport = (settings: ICachedSettings) => {
	passport.serializeUser((user: any, done) => {
		done(null, user.providerId || user.id);
	});

	passport.deserializeUser(async (id, done) => {
		const user = await Users.findOneById(id as string);
		done(null, user);
	});

	settings.watchByRegex(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i, () => {
		const services = getOAuthServices(settings);
		logger.debug({ msg: 'OAuth services detected', services: services.map((s) => s.name) });

		const oauthServiceConfigs = createOAuthServiceConfig(settings, services);
		configureOAuthServices(oauthServiceConfigs);
	});

	WebApp.rawConnectHandlers.use(oAuthRouter);
};
