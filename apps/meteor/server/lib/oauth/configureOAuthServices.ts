import { type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';
import passport from 'passport';
import type { Profile, DoneCallback } from 'passport';

import type { OAuthServiceConfig } from './createOAuthServiceConfig';
import { doesUserRequire2FA } from './twoFactorAuth';
import type { ICachedSettings } from '../../../app/settings/server/CachedSettings';
import { oAuthRouter } from '../../configuration/configurePassport';

interface IOAuthRequest extends Request {
	user?: IUser;
}

export const configureOAuthServices = (oauthServiceConfig: OAuthServiceConfig[], settings: ICachedSettings) => {
	oauthServiceConfig.forEach((config) => {
		const Strategy = config.strategy;
		const siteUrl = settings.get<string>('Site_Url');

		passport.unuse(config.provider);

		passport.use(
			config.provider,
			new Strategy(
				{
					clientID: config.clientId,
					clientSecret: config.clientSecret,
					callbackURL: `${siteUrl}/oauth/${config.provider}/callback`,
					state: true,
					pkce: true,
					scope: config.scope,
					profileFields: ['id', 'displayName', 'emails'],
				},
				async (accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) => {
					const profileWithRaw = profile as Profile & { _json?: Record<string, unknown>; _raw?: string };
					const { _json, _raw, ...restProfile } = profileWithRaw;

					// eslint-disable-next-line @typescript-eslint/await-thenable
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
			passport.authenticate(config.provider, { scope: config.scope, prompt: 'consent', failureRedirect: '/login' }),
		);
		oAuthRouter.get(
			`/oauth/${config.provider}/callback`,
			passport.authenticate(config.provider, { failureRedirect: '/login', failureFlash: true, failWithError: true }),
			async (req: IOAuthRequest, res: Response) => {
				const oAuthUser = req.user as IUser;

				if (!oAuthUser) {
					// return res.redirect('/login');
					return res.redirect('/noOauthUser');
				}

				const secondFactorMethod = doesUserRequire2FA(oAuthUser);

				if (secondFactorMethod) {
					const challengeId = await secondFactorMethod.sendTwoFactorChallenge(oAuthUser);
					return res.redirect(`/2fa/${secondFactorMethod.method}/${challengeId}`);
				}

				const stampedToken = Accounts._generateStampedLoginToken();
				await Accounts._insertLoginToken(oAuthUser._id, stampedToken);

				res.redirect(`/home?resumeToken=${stampedToken.token}`);

				req.session.destroy((err) => {
					if (err) {
						console.error('Error destroying session', err);
					}
				});
			},
		);
	});
};
