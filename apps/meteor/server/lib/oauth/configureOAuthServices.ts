import { type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';
import type { Profile, DoneCallback } from 'passport';

import type { OAuthServiceConfig } from './createOAuthServiceConfig';
import { doesUserRquire2FA } from './twoFactorAuth';
import { oAuthRouter } from '../../configuration/configurePassport';

export const configureOAuthServices = (oauthServiceConfig: OAuthServiceConfig[]) => {
	oauthServiceConfig.forEach((config) => {
		const Strategy = config.strategy;

		passport.unuse(config.provider);

		passport.use(
			config.provider,
			new Strategy(
				{
					clientID: config.clientId,
					clientSecret: config.clientSecret,
					callbackURL: `${Meteor.absoluteUrl()}oauth/${config.provider}/callback`,
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
			passport.authenticate(config.provider, { failureRedirect: '/login' }),
			async (req, res) => {
				const oAuthUser = req.user as IUser;

				if (!oAuthUser) {
					return res.redirect('/login');
				}

				const secondFactorMethod = doesUserRquire2FA(oAuthUser);

				if (secondFactorMethod) {
					console.log('2fa required');
					const challengeId = await secondFactorMethod.sendEmailTwoFactorChallenge(oAuthUser);
					console.log('challengeId - ', challengeId);
					return res.redirect(`/2fa/${secondFactorMethod.method}/${challengeId}`);
				}

				console.log('no 2fa required');

				const stampedToken = Accounts._generateStampedLoginToken();
				Accounts._insertLoginToken(oAuthUser._id, stampedToken);

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
