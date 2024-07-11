import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import type { IOAuthProvider } from '../../definitions/IOAuthProvider';
import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { loginServices } from '../../lib/loginServices';

const isLoginCancelledError = (error: unknown): error is Meteor.Error =>
	error instanceof Meteor.Error && error.error === Accounts.LoginCancelledError.numericError;

export const convertError = <T>(error: T): Accounts.LoginCancelledError | T => {
	if (isLoginCancelledError(error)) {
		return new Accounts.LoginCancelledError(error.reason);
	}

	return error;
};

// NOTE: this is a hack to avoid reactivity issues when the login type is redirect
// On redirect flow, the UI requests for some endpoints _before_ the user logs in with a resume (our) token
// This causes the UI to sometimes not show the data appropiately, like permissions, avatar & the user status
// So, what this does is to force a full page refresh whenever the login type is redirect so everything works normally
// Ideally, we'll remove this when we investigate in deep the reactivity problem
Meteor.startup(async () => {
	const oauthData = OAuth.getDataAfterRedirect();
	if (!oauthData) {
		return;
	}
	const redirectRefreshState = localStorage.getItem('oauth_redirect_refresh_state');
	const service = await loginServices.loadLoginService<OAuthConfiguration>(oauthData.loginService);
	if (!service) {
		return;
	}
	if (redirectRefreshState === 'complete' || service.loginStyle !== 'redirect') {
		localStorage.removeItem('oauth_redirect_refresh_state');
		return;
	}

	localStorage.setItem('oauth_redirect_refresh_state', 'pending');
});

Accounts.onLogin((login: any) => {
	const oauthData = localStorage.getItem('oauth_redirect_refresh_state');
	if (oauthData === 'pending' && login.type === 'resume') {
		localStorage.setItem('oauth_redirect_refresh_state', 'complete');
		location.reload();
	}
});

let lastCredentialToken: string | null = null;
let lastCredentialSecret: string | null | undefined = null;

const meteorOAuthRetrieveCredentialSecret = OAuth._retrieveCredentialSecret;
OAuth._retrieveCredentialSecret = (credentialToken: string): string | null => {
	let secret = meteorOAuthRetrieveCredentialSecret.call(OAuth, credentialToken);
	if (!secret) {
		const localStorageKey = `${OAuth._storageTokenPrefix}${credentialToken}`;
		secret = localStorage.getItem(localStorageKey);
		localStorage.removeItem(localStorageKey);
	}

	return secret;
};

const tryLoginAfterPopupClosed = (
	credentialToken: string,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
	totpCode?: string,
	credentialSecret?: string | null,
) => {
	credentialSecret = credentialSecret || OAuth._retrieveCredentialSecret(credentialToken) || null;
	const methodArgument = {
		oauth: {
			credentialToken,
			credentialSecret,
		},
		...(typeof totpCode === 'string' &&
			!!totpCode && {
				totp: {
					code: totpCode,
				},
			}),
	};

	lastCredentialToken = credentialToken;
	lastCredentialSecret = credentialSecret;

	if (typeof totpCode === 'string' && !!totpCode) {
		methodArgument.totp = {
			code: totpCode,
		};
	}

	Accounts.callLoginMethod({
		methodArguments: [methodArgument],
		userCallback: (err) => {
			callback?.(convertError(err));
		},
	});
};

const credentialRequestCompleteHandler =
	(callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void, totpCode?: string) =>
	(credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => {
		if (!credentialTokenOrError) {
			callback?.(new Meteor.Error('No credential token passed'));
			return;
		}

		if (credentialTokenOrError instanceof Error) {
			callback?.(credentialTokenOrError);
			return;
		}

		tryLoginAfterPopupClosed(credentialTokenOrError, callback, totpCode);
	};

export const createOAuthTotpLoginMethod =
	(provider: IOAuthProvider) => (options: Meteor.LoginWithExternalServiceOptions | undefined, code: string, callback?: LoginCallback) => {
		if (lastCredentialToken && lastCredentialSecret) {
			tryLoginAfterPopupClosed(lastCredentialToken, callback, code, lastCredentialSecret);
		} else {
			const credentialRequestCompleteCallback = credentialRequestCompleteHandler(callback, code);
			provider.requestCredential(options, credentialRequestCompleteCallback);
		}

		lastCredentialToken = null;
		lastCredentialSecret = null;
	};

Accounts.oauth.credentialRequestCompleteHandler = credentialRequestCompleteHandler;

Accounts.onPageLoadLogin(async (loginAttempt: any) => {
	if (loginAttempt?.error?.error !== 'totp-required') {
		return;
	}

	const { methodArguments } = loginAttempt;
	if (!methodArguments?.length) {
		return;
	}

	const oAuthArgs = methodArguments.find((arg: any) => arg.oauth);
	const { credentialToken, credentialSecret } = oAuthArgs.oauth;
	const cb = loginAttempt.userCallback;

	const { process2faReturn } = await import('../../lib/2fa/process2faReturn');

	await process2faReturn({
		error: loginAttempt.error,
		originalCallback: cb,
		onCode: (code) => {
			tryLoginAfterPopupClosed(credentialToken, cb, code, credentialSecret);
		},
		emailOrUsername: undefined,
		result: undefined,
	});
});
