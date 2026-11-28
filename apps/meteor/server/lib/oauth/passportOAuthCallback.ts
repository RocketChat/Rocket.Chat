import crypto from 'crypto';

import { isClientSafeError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LoginCodes } from '@rocket.chat/models';
import type { NextFunction, Request, Response } from 'express';

import { doesUserRequire2FA } from './twoFactorAuth';
import { issueLoginToken } from '../auth/issueLoginToken';

const logger = new Logger('OAuth');

type LaunchStyle = 'popup' | 'redirect' | undefined;

const sendPopupMessage = (res: Response, payload: unknown) => {
	const nonce = crypto.randomBytes(16).toString('base64');
	res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

	res.send(`
		<script nonce="${nonce}">
			const message = ${JSON.stringify(payload)};
			if (window.opener && !window.opener.closed) {
				window.opener.postMessage(message, window.location.origin);
			} else {
				const channel = new BroadcastChannel('oauth-popup');
				channel.postMessage(message);
				channel.close();
			}
			window.close();
		</script>
	`);
};

const handlePopupStyleOAuth = async (res: Response, oAuthUser: IUser, loginClient?: string) => {
	const secondFactorMethod = doesUserRequire2FA(oAuthUser);

	if (secondFactorMethod) {
		const challengeId = await secondFactorMethod.sendTwoFactorChallenge(oAuthUser);
		sendPopupMessage(res, {
			oauthPopupCommand: 'redirect',
			path: `/2fa/${secondFactorMethod.method}/${challengeId}${loginClient ? `?loginClient=${loginClient}` : ''}`,
		});
		return;
	}

	const { token } = await issueLoginToken(oAuthUser._id);

	if (loginClient) {
		sendPopupMessage(res, {
			oauthPopupCommand: 'redirect',
			path: `home?resumeToken=${token}&userId=${oAuthUser._id}&loginClient=${loginClient}`,
		});
		return;
	}

	sendPopupMessage(res, { oauthPopupCommand: 'oauth-login-with-token', token });
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

export const passportOAuthErrorCallback =
	(siteUrl: string, launchStyle: LaunchStyle = 'redirect') =>
	(err: unknown, _req: Request, res: Response, _next: NextFunction) => {
		logger.error({ msg: 'OAuth login failed', err });

		const oauthError = isClientSafeError(err) && err.error === 'error-invalid-username' ? err.error : 'error-oauth-login-failed';

		if (launchStyle === 'popup') {
			sendPopupMessage(res, { oauthPopupCommand: 'login-error', oauthError });
			return;
		}

		const redirectUrl = new URL(`${siteUrl}/home`);
		redirectUrl.searchParams.set('oauthError', oauthError);
		res.redirect(redirectUrl.toString());
	};
