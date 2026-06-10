import crypto from 'crypto';

import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';

import { doesUserRequire2FA } from './twoFactorAuth';

const logger = new Logger('OAuth');

type LaunchStyle = 'popup' | 'redirect' | undefined;

export const passportOAuthCallback =
	(siteUrl: string, launchStyle: LaunchStyle = 'redirect') =>
	async (req: Request, res: Response) => {
		const oAuthUser = req.user as IUser;

		if (!oAuthUser) {
			return res.redirect('/login');
		}

		const { loginClient } = req.session;

		const secondFactorMethod = doesUserRequire2FA(oAuthUser);

		if (launchStyle === 'popup') {
			const stampedToken = Accounts._generateStampedLoginToken();
			await Accounts._insertLoginToken(oAuthUser._id, stampedToken);
			const nonce = crypto.randomBytes(16).toString('base64');
			res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);
			res.send(`
			<script nonce="${nonce}">
				window.opener.postMessage(
					{
						externalCommand: 'login-with-token',
						token: '${stampedToken.token}',
					},
					window.location.origin
				);
				window.close();
			</script>
			`);
			return;
		}

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
