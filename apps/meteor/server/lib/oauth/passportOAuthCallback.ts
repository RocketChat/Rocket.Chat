import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';

import { doesUserRequire2FA } from './twoFactorAuth';

const logger = new Logger('OAuth');

export const passportOAuthCallback = (siteUrl: string) => async (req: Request, res: Response) => {
	const oAuthUser = req.user as IUser;

	if (!oAuthUser) {
		return res.redirect('/login');
	}

	const { loginClient } = req.session;

	const secondFactorMethod = doesUserRequire2FA(oAuthUser);

	if (secondFactorMethod) {
		const challengeId = await secondFactorMethod.sendTwoFactorChallenge(oAuthUser);
		const twoFARedirectUrl = new URL(`/2fa/${secondFactorMethod.method}/${challengeId}`, siteUrl);

		if (loginClient) {
			twoFARedirectUrl.searchParams.set('loginClient', loginClient);
		}

		return res.redirect(twoFARedirectUrl.toString());
	}

	const stampedToken = Accounts._generateStampedLoginToken();
	await Accounts._insertLoginToken(oAuthUser._id, stampedToken);

	const redirectUrl = new URL(`/home`, siteUrl);

	redirectUrl.searchParams.set('resumeToken', stampedToken.token);
	redirectUrl.searchParams.set('userId', oAuthUser._id);

	if (loginClient) {
		redirectUrl.searchParams.set('loginClient', loginClient);
	}

	setImmediate(() => res.redirect(redirectUrl.toString()));

	req.session.destroy((err) => {
		if (err) {
			logger.error({ msg: 'Error destroying OAuth session', err });
		}
	});
};
