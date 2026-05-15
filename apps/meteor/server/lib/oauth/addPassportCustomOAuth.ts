import type { OAuthConfiguration, IUser } from '@rocket.chat/core-typings';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';
import passport from 'passport';
import type { DoneCallback, Profile } from 'passport';

import { verifyFunction } from './verifyFunction';
import { CustomOAuthStrategy } from '../../../app/custom-oauth/server/customOAuth';
import { oAuthRouter } from '../../configuration/configurePassport';

interface IOAuthRequest extends Request {
	user?: IUser;
}

export const addPassportCustomOAuth = (serviceName: string, config: Partial<OAuthConfiguration & { clientSecret: string }>) => {
	passport.unuse(serviceName);

	passport.use(
		serviceName,
		new CustomOAuthStrategy(
			serviceName,
			config as OAuthConfiguration & { clientSecret: string },
			(accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) =>
				verifyFunction(accessToken, refreshToken, profile, done, serviceName),
		),
	);

	oAuthRouter.get(
		`/oauth/${serviceName}`,
		passport.authenticate(serviceName, { scope: config.scope, prompt: 'consent', failureRedirect: '/login' }),
	);

	oAuthRouter.get(
		`/oauth/${serviceName}/callback`,
		passport.authenticate(serviceName, { failureRedirect: '/login', failureFlash: true, failWithError: true }),
		async (req: IOAuthRequest, res: Response) => {
			const oAuthUser = req.user as IUser;

			if (!oAuthUser) {
				return res.redirect('/login');
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
};
