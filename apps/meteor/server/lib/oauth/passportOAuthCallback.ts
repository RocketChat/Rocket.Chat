import type { IUser } from '@rocket.chat/core-typings';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';

export const passportOAuthCallback = (siteUrl: string) => async (req: Request, res: Response) => {
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
};
