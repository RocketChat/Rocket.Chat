import passport from 'passport';
import type { Profile, DoneCallback } from 'passport';

import { allowPassportOAuthMiddleware } from './allowPassportOAuthMiddleware';
import type { OAuthServiceConfig } from './createOAuthServiceConfig';
import { passportOAuthCallback } from './passportOAuthCallback';
import { removeOAuthRoutes } from './removeOAuthRoutes';
import { verifyFunction } from './verifyFunction';
import { oAuthRouter } from '../../configuration/configurePassport';
import type { ICachedSettings } from '../../settings/CachedSettings';

export const configureOAuthServices = (oauthServiceConfig: OAuthServiceConfig[], settings: ICachedSettings) => {
	oauthServiceConfig.forEach((config) => {
		const Strategy = config.strategy;
		const siteUrl = settings.get<string>('Site_Url').replace(/\/$/, '');

		passport.unuse(config.provider);
		removeOAuthRoutes(config.provider);

		passport.use(
			config.provider,
			new Strategy(
				{
					...config,
					clientID: config.clientId,
					clientSecret: config.clientSecret,
					consumerKey: config.clientId,
					consumerSecret: config.clientSecret,
					callbackURL: `${siteUrl}/_oauth/${config.provider}`,
					state: true,
					pkce: true,
					profileFields: ['id', 'displayName', 'emails'],
				},
				(accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) =>
					verifyFunction(accessToken, refreshToken, profile, done, config.provider),
			),
		);

		oAuthRouter.get(
			`/oauth/${config.provider}`,
			allowPassportOAuthMiddleware(config.provider),
			(req, _res, next) => {
				const { loginClient } = req.query;
				if (loginClient === 'mobile' || loginClient === 'desktop') {
					req.session.loginClient = loginClient;
					req.session.save(() => {
						next();
					});
				} else {
					//delete stale value from previous sessions if any
					delete req.session.loginClient;
					next();
				}
			},
			passport.authenticate(config.provider, { scope: config.scope, prompt: 'consent', failureRedirect: '/login', keepSessionInfo: true }),
		);
		oAuthRouter.get(
			`/_oauth/${config.provider}`,
			allowPassportOAuthMiddleware(config.provider),
			passport.authenticate(config.provider, { failureRedirect: '/login', failWithError: true, keepSessionInfo: true }),
			passportOAuthCallback(siteUrl),
		);
	});
};
