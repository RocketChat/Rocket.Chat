import { type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';
import passport from 'passport';
import type { Profile, DoneCallback } from 'passport';

import type { OAuthServiceConfig } from './createOAuthServiceConfig';
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
					callbackURL: `${siteUrl}/oauth/${config.provider}/callback`,
					state: true,
					pkce: true,
					profileFields: ['id', 'displayName', 'emails'],
					...config,
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
							email: profile?.emails?.[0]?.value,
							...restProfile,
							..._json,
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
					next();
				}
			},
			passport.authenticate(config.provider, { scope: config.scope, prompt: 'consent', failureRedirect: '/login', keepSessionInfo: true }),
		);
		oAuthRouter.get(
			`/oauth/${config.provider}/callback`,
			passport.authenticate(config.provider, { failureRedirect: '/login', failureFlash: true, failWithError: true, keepSessionInfo: true }),
			async (req: Request, res: Response) => {
				const oAuthUser = req.user as IUser;

				if (!oAuthUser) {
					return res.redirect('/login');
				}

				const { loginClient } = req.session;

				const stampedToken = Accounts._generateStampedLoginToken();
				await Accounts._insertLoginToken(oAuthUser._id, stampedToken);

				const redirectUrl = new URL(`/home`, siteUrl);

				redirectUrl.searchParams.set('resumeToken', stampedToken.token);
				redirectUrl.searchParams.set('userId', oAuthUser._id);

				if (loginClient) {
					redirectUrl.searchParams.set('loginClient', loginClient);
				}

				res.redirect(redirectUrl.toString());

				req.session.destroy((err) => {
					if (err) {
						console.error('Error destroying session', err);
					}
				});
			},
		);
	});
};
