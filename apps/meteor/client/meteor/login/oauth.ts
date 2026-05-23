import { isTotpRequiredError } from '@rocket.chat/api-client';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { LoginCancelledError } from './LoginCancelledError';
import type { IOAuthProvider } from '../../definitions/IOAuthProvider';
import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';

const isLoginCancelledError = (error: unknown): error is Meteor.Error =>
	error instanceof Meteor.Error && error.error === LoginCancelledError.numericError;

export const convertError = <T>(error: T): LoginCancelledError | T => {
	if (isLoginCancelledError(error)) {
		return new LoginCancelledError(error.reason);
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

getDdpSdk().account.onPageLoadLogin(async (loginAttempt: any) => {
	if (loginAttempt?.error && !isTotpRequiredError(loginAttempt.error)) {
		return;
	}

	const { methodArguments } = loginAttempt;
	if (!methodArguments?.length) {
		return;
	}

	const oAuthArgs = methodArguments.find((arg: any) => arg.oauth);
	const { credentialToken, credentialSecret } = oAuthArgs.oauth;
	const cb = loginAttempt.userCallback;

	const { challenge2fa } = await import('../../lib/2fa/challenge2fa');

	const retryLogin = async (error: any) => {
		const challenge = challenge2fa({
			error,
			errorHandler: cb,
		});

		if (!challenge) {
			throw new Error('Unable to challenge 2fa');
		}

		const [code, resolveChallenge] = challenge;
		const resolvedCode = await code;

		try {
			tryLoginAfterPopupClosed(credentialToken, cb, resolvedCode, credentialSecret);
		} catch (error) {
			resolveChallenge();
		}
	};

	await retryLogin(loginAttempt.error);
});
