import { type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';
import type { Strategy, Profile, DoneCallback } from 'passport';

import { oAuthRouter } from '../../configuration/configurePassport';

type OAuthServiceConfig = {
	provider: string;
	strategy: new (...args: any[]) => Strategy;
	clientId: string;
	clientSecret: string;
	scope: string[];
};

export const configureOAuthServices = (oauthServiceConfig: OAuthServiceConfig[]) => {
	oauthServiceConfig.forEach((config) => {
		const Strategy = config.strategy;

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
				(accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) => {
					console.log('user authenticated -> oauth callback', { accessToken, refreshToken, profile });
					const profileWithRaw = profile as Profile & { _json?: Record<string, unknown>; _raw?: string };
					const { _json, _raw, ...restProfile } = profileWithRaw;
					//TODO: Check the user account already exists here, and if not then create here and then pass on callback function
					return done(null, {
						accessToken,
						refreshToken,
						name: profile.displayName,
						email: profile?.emails?.[0]?.value,
						...restProfile,
						..._json,
					});
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
				console.log('github/callback', req.user);

				const oAuthUser = req.user;

				if (!oAuthUser) {
					return res.redirect('/login');
				}

				console.log('oAuthUser', oAuthUser);

				//TODO: refactor service data
				//TODO: types
				// eslint-disable-next-line @typescript-eslint/await-thenable
				const user = (await Accounts.updateOrCreateUserFromExternalService(
					config.provider,
					{
						...oAuthUser,
					},
					oAuthUser,
				)) as unknown as IUser;

				if (!user?.userId) {
					return res.redirect('/login');
				}

				const userFromDB = await Users.findOneById(user?.userId as string);
				console.log('userFromDB', userFromDB);

				const stampedToken = Accounts._generateStampedLoginToken();
				Accounts._insertLoginToken(userFromDB?._id as string, stampedToken);

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
