import crypto from 'crypto';

import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LoginCodes } from '@rocket.chat/models';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';

import { doesUserRequire2FA } from './twoFactorAuth';

const logger = new Logger('OAuth');

type LaunchStyle = 'popup' | 'redirect' | undefined;

const createLoginToken = async (userId: string) => {
	const stampedToken = Accounts._generateStampedLoginToken();
	await Accounts._insertLoginToken(userId, stampedToken);

	return stampedToken.token;
};

const sendPopupMessage = (res: Response, payload: unknown) => {
	const nonce = crypto.randomBytes(16).toString('base64');
	res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

	res.send(`
		<script nonce="${nonce}">
			window.opener.postMessage(
				${JSON.stringify(payload)},
				window.location.origin
			);
			window.close();
		</script>
	`);
};

const handlePopupStyleOAuth = async (res: Response, oAuthUser: IUser, loginClient?: string) => {
	const secondFactorMethod = doesUserRequire2FA(oAuthUser);

	if (secondFactorMethod) {
		const challengeId = await secondFactorMethod.sendTwoFactorChallenge(oAuthUser);
		sendPopupMessage(res, {
			externalCommand: 'go',
			path: `/2fa/${secondFactorMethod.method}/${challengeId}${loginClient ? `?loginClient=${loginClient}` : ''}`,
		});
		return;
	}

	const token = await createLoginToken(oAuthUser._id);

	if (loginClient) {
		sendPopupMessage(res, {
			externalCommand: 'go',
			path: `home?resumeToken=${token}&userId=${oAuthUser._id}&loginClient=${loginClient}`,
		});
		return;
	}

	sendPopupMessage(res, { externalCommand: 'login-with-token', token });
};

export const passportOAuthCallback =
	(siteUrl: string, launchStyle: LaunchStyle = 'redirect') =>
	async (req: Request, res: Response) => {
		const oAuthUser = req.user as IUser;

		if (!oAuthUser) {
			return res.redirect('/login');
		}

		const { loginClient } = req.session;

		if (launchStyle === 'popup') {
			await handlePopupStyleOAuth(res, oAuthUser, loginClient);
			return;
		}

		const secondFactorMethod = doesUserRequire2FA(oAuthUser);

		if (secondFactorMethod) {
			const challengeId = await secondFactorMethod.sendTwoFactorChallenge(oAuthUser);
			const twoFARedirectUrl = new URL(`/2fa/${secondFactorMethod.method}/${challengeId}`, siteUrl);

			if (loginClient) {
				twoFARedirectUrl.searchParams.set('loginClient', loginClient);
			}

			return res.redirect(twoFARedirectUrl.toString());
		}

		const loginCode = await LoginCodes.createCode(oAuthUser._id);

		const redirectUrl = new URL(`/home`, siteUrl);

		redirectUrl.searchParams.set('loginCode', loginCode);

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
