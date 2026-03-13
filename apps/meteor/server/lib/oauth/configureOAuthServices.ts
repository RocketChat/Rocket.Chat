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
				},
				(accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) => {
					console.log({ accessToken, refreshToken, profile });
					return done(null, {
						provider: config.provider,
						providerId: profile.id,
						email: profile?.emails?.[0]?.value,
						name: profile.displayName,
					});
				},
			),
		);
		oAuthRouter.get(`/oauth/${config.provider}`, passport.authenticate(config.provider, { failureRedirect: '/login' }));
		oAuthRouter.get(
			`/oauth/${config.provider}/callback`,
			passport.authenticate(config.provider, { failureRedirect: '/login' }),
			async (req, res) => {
				console.log('github/callback', req.user);

				const oAuthUser = req.user;

				if (!oAuthUser) {
					return res.redirect('/login');
				}

				//TODO: refactor service data
				//TODO: types
				const user = await Accounts.updateOrCreateUserFromExternalService(
					config.provider,
					{
						...oAuthUser,
						id: oAuthUser.providerId,
					},
					oAuthUser,
				);

				if (!user?.userId) {
					return res.redirect('/login');
				}

				const userFromDB = await Users.findOneById(user?.userId as string);
				console.log('userFromDB', userFromDB);

				const stampedToken = Accounts._generateStampedLoginToken();
				Accounts._insertLoginToken(userFromDB?._id as string, stampedToken);

				res.redirect(`http://localhost:3000/home?resumeToken=${stampedToken.token}`);

				req.session.destroy((err) => {
					if (err) {
						console.error('Error destroying session', err);
					}
				});
			},
		);
	});
};
