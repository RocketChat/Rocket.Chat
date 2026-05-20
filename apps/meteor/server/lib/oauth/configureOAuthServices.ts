import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import passport from 'passport';
import type { Profile, DoneCallback } from 'passport';

import type { OAuthServiceConfig } from './createOAuthServiceConfig';
import { passportOAuthCallback } from './passportOAuthCallback';
import type { ICachedSettings } from '../../../app/settings/server/CachedSettings';
import { oAuthRouter } from '../../configuration/configurePassport';

export const configureOAuthServices = (oauthServiceConfig: OAuthServiceConfig[], settings: ICachedSettings) => {
	oauthServiceConfig.forEach((config) => {
		const Strategy = config.strategy;
		const siteUrl = settings.get<string>('Site_Url');

		passport.unuse(config.provider);

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
				async (accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) => {
					const profileWithRaw = profile as Profile & { _json?: Record<string, unknown>; _raw?: string };
					const { _json, _raw, ...restProfile } = profileWithRaw;

					const user = await Accounts.updateOrCreateUserFromExternalService(
						config.provider,
						{
							accessToken,
							refreshToken,
							name: profile.displayName,
							...restProfile,
							..._json,
							email: profile?.emails?.[0]?.value,
						},
						{},
					);

					if (!user?.userId || typeof user?.userId !== 'string') {
						return done(new Error('User not found'));
					}

					const userFromDB = await Users.findOneById(user.userId);

					if (!userFromDB) {
						return done(new Error('User not found'));
					}

					return done(null, userFromDB);
				},
			),
		);

		oAuthRouter.get(
			`/oauth/${config.provider}`,
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
			passport.authenticate(config.provider, { failureRedirect: '/login', failureFlash: true, failWithError: true, keepSessionInfo: true }),
			passportOAuthCallback(siteUrl),
		);
	});
};
