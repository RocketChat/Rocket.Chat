import type { IUser } from '@rocket.chat/core-typings';
import express from 'express';
import flash from 'express-flash';
import rateLimit from 'express-rate-limit';
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
			cookie: {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				maxAge: 5 * 60 * 1000, // 5 minutes
			},
		}),
	);

	oAuthRouter.use(passport.initialize());
	oAuthRouter.use(passport.session());
	oAuthRouter.use(flash());

	const oauthRateLimiter = rateLimit({
		windowMs: settings.get<number>('API_Enable_Rate_Limiter_Limit_Time_Default'),
		max: settings.get<number>('API_Enable_Rate_Limiter_Limit_Calls_Default'),
		skip: () =>
			settings.get<boolean>('API_Enable_Rate_Limiter') !== true ||
			(process.env.NODE_ENV === 'development' && settings.get<boolean>('API_Enable_Rate_Limiter_Dev') !== true),
		handler: (_req, res) => {
			res.status(429).json({
				success: false,
				error: 'Too many requests. Please try again later.',
			});
		},
	});

	oAuthRouter.use(oauthRateLimiter);

	passport.serializeUser((user: any, done) => {
		done(null, user);
	});

	passport.deserializeUser(async (user: IUser, done) => {
		// const user = await Users.findOneById(id as string);
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
