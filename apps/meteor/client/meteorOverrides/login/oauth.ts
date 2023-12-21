import { capitalize } from '@rocket.chat/string-helpers';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { CustomOAuth } from '../../../app/custom-oauth/client/custom_oauth_client';
import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';

const isLoginCancelledError = (error: unknown): error is Meteor.Error =>
	error instanceof Meteor.Error && error.error === Accounts.LoginCancelledError.numericError;

export const convertError = <T>(error: T): Accounts.LoginCancelledError | T => {
	if (isLoginCancelledError(error)) {
		return new Accounts.LoginCancelledError(error.reason);
	}

	return error;
};

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
		userCallback:
			callback &&
			function (err) {
				callback(convertError(err));
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

		if (credentialTokenOrError && credentialTokenOrError instanceof Error) {
			callback?.(credentialTokenOrError);
		} else {
			tryLoginAfterPopupClosed(credentialTokenOrError, callback, totpCode);
		}
	};

interface IOAuthProvider {
	requestCredential(
		options: Meteor.LoginWithExternalServiceOptions | undefined,
		credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
	): void;
}

export const createOAuthTotpLoginMethod = (credentialProviderFactory?: () => IOAuthProvider) =>
	function (this: IOAuthProvider, options: Meteor.LoginWithExternalServiceOptions | undefined, code: string, callback?: LoginCallback) {
		if (lastCredentialToken && lastCredentialSecret) {
			tryLoginAfterPopupClosed(lastCredentialToken, callback, code, lastCredentialSecret);
		} else {
			const provider = credentialProviderFactory?.() || this;
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

const loginWithOAuthTokenAndTOTP = createOAuthTotpLoginMethod();

const oldConfigureLogin = CustomOAuth.prototype.configureLogin;
CustomOAuth.prototype.configureLogin = function (...args) {
	const loginWithService = `loginWith${capitalize(String(this.name || ''))}`;

	oldConfigureLogin.apply(this, args);

	const loginWithOAuthToken = (Meteor as any)[loginWithService];
	(Meteor as any)[loginWithService] = (options: Meteor.LoginWithExternalServiceOptions, callback: LoginCallback) => {
		overrideLoginMethod(loginWithOAuthToken, [options], callback, loginWithOAuthTokenAndTOTP);
	};
};
