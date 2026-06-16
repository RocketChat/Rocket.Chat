import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import passport from 'passport';
import type { DoneCallback, Profile } from 'passport';

import { passportOAuthCallback } from './passportOAuthCallback';
import { verifyFunction } from './verifyFunction';
import { CustomOAuthStrategy } from '../../../app/custom-oauth/server/customOAuth';
import { settings } from '../../../app/settings/server';
import { oAuthRouter } from '../../configuration/configurePassport';

export const addPassportCustomOAuth = (serviceName: string, config: Partial<OAuthConfiguration & { clientSecret: string }>) => {
	passport.unuse(serviceName);

	if (!config.clientId || !config.clientSecret || !config.serverURL) {
		return;
	}

	passport.use(
		serviceName,
		new CustomOAuthStrategy(
			serviceName,
			config as OAuthConfiguration & { clientSecret: string },
			(accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) =>
				verifyFunction(accessToken, refreshToken, profile, done, serviceName),
		),
	);

	const siteUrl = settings.get<string>('Site_Url');

	oAuthRouter.get(
		`/oauth/${serviceName}`,
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
		passport.authenticate(serviceName, { scope: config.scope, prompt: 'consent', failureRedirect: '/login', keepSessionInfo: true }),
	);

	oAuthRouter.get(
		`/_oauth/${serviceName}`,
		(_req, _res, next) => {
			const isPassportFlowEnabled = settings.get<boolean>('Accounts_OAuth_Use_Modern_Flow');
			if (isPassportFlowEnabled) {
				next();
			} else {
				next('router');
			}
		},
		passport.authenticate(serviceName, { failureRedirect: '/login', failWithError: true, keepSessionInfo: true }),
		passportOAuthCallback(siteUrl, config.loginStyle ? config.loginStyle : undefined),
	);
};
