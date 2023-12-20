import { capitalize } from '@rocket.chat/string-helpers';
import { Accounts } from 'meteor/accounts-base';
import { Facebook } from 'meteor/facebook-oauth';
import { Github } from 'meteor/github-oauth';
import { Meteor } from 'meteor/meteor';
import { MeteorDeveloperAccounts } from 'meteor/meteor-developer-oauth';
import { OAuth } from 'meteor/oauth';
import { Linkedin } from 'meteor/pauli:linkedin-oauth';
import { Twitter } from 'meteor/twitter-oauth';

import { CustomOAuth } from '../../../app/custom-oauth/client/custom_oauth_client';
import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { process2faReturn } from '../../lib/2fa/process2faReturn';
import { convertError } from '../../lib/2fa/utils';

declare module 'meteor/accounts-base' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Accounts {
		// eslint-disable-next-line @typescript-eslint/no-namespace
		namespace oauth {
			function tryLoginAfterPopupClosed(
				credentialToken: string,
				callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
				totpCode?: string,
				credentialSecret?: string | null,
			): void;

			function credentialRequestCompleteHandler(
				callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
				totpCode?: string,
			): (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void;
		}
	}
}

declare module 'meteor/oauth' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace OAuth {
		function _retrieveCredentialSecret(credentialToken: string): string | null;
		const _storageTokenPrefix: string;
	}
}

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

Accounts.oauth.tryLoginAfterPopupClosed = function (credentialToken, callback, totpCode, credentialSecret = null) {
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

Accounts.oauth.credentialRequestCompleteHandler = function (callback, totpCode) {
	return function (credentialTokenOrError) {
		if (!credentialTokenOrError) {
			callback?.(new Meteor.Error('No credential token passed'));
			return;
		}

		if (credentialTokenOrError && credentialTokenOrError instanceof Error) {
			callback?.(credentialTokenOrError);
		} else {
			Accounts.oauth.tryLoginAfterPopupClosed(credentialTokenOrError, callback, totpCode);
		}
	};
};

const createOAuthTotpLoginMethod = (credentialProvider?: any) => (options: any, code: any, callback: any) => {
	// support a callback without options
	if (!callback && typeof options === 'function') {
		callback = options;
		options = null;
	}

	if (lastCredentialToken && lastCredentialSecret) {
		Accounts.oauth.tryLoginAfterPopupClosed(lastCredentialToken, callback, code, lastCredentialSecret);
	} else {
		const provider = credentialProvider?.() || this;
		const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback, code);
		provider.requestCredential(options, credentialRequestCompleteCallback);
	}

	lastCredentialToken = null;
	lastCredentialSecret = null;
};

const loginWithOAuthTokenAndTOTP = createOAuthTotpLoginMethod();

const loginWithFacebookAndTOTP = createOAuthTotpLoginMethod(() => Facebook);
const { loginWithFacebook } = Meteor;
Meteor.loginWithFacebook = function (options, cb) {
	overrideLoginMethod(loginWithFacebook, [options], cb, loginWithFacebookAndTOTP);
};

const loginWithGithubAndTOTP = createOAuthTotpLoginMethod(() => Github);
const { loginWithGithub } = Meteor;
Meteor.loginWithGithub = function (options, cb) {
	overrideLoginMethod(loginWithGithub, [options], cb, loginWithGithubAndTOTP);
};

const loginWithMeteorDeveloperAccountAndTOTP = createOAuthTotpLoginMethod(() => MeteorDeveloperAccounts);
const { loginWithMeteorDeveloperAccount } = Meteor;
Meteor.loginWithMeteorDeveloperAccount = function (options, cb) {
	overrideLoginMethod(loginWithMeteorDeveloperAccount, [options], cb, loginWithMeteorDeveloperAccountAndTOTP);
};

const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod(() => Twitter);
const { loginWithTwitter } = Meteor;
Meteor.loginWithTwitter = function (options, cb) {
	overrideLoginMethod(loginWithTwitter, [options], cb, loginWithTwitterAndTOTP);
};

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithLinkedin(options: any, callback?: (error?: Meteor.Error | Meteor.TypedError) => void): void;
	}
}

const loginWithLinkedinAndTOTP = createOAuthTotpLoginMethod(() => Linkedin);
const { loginWithLinkedin } = Meteor;
Meteor.loginWithLinkedin = function (options: any, cb: any) {
	overrideLoginMethod(loginWithLinkedin, [options], cb, loginWithLinkedinAndTOTP);
};

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

	await process2faReturn({
		error: loginAttempt.error,
		originalCallback: cb,
		onCode: (code) => {
			Accounts.oauth.tryLoginAfterPopupClosed(credentialToken, cb, code, credentialSecret);
		},
		emailOrUsername: undefined,
		result: undefined,
	});
});

const oldConfigureLogin = CustomOAuth.prototype.configureLogin;
CustomOAuth.prototype.configureLogin = function (...args) {
	const loginWithService = `loginWith${capitalize(String(this.name || ''))}`;

	oldConfigureLogin.apply(this, args);

	const loginWithOAuthToken = (Meteor as any)[loginWithService];
	(Meteor as any)[loginWithService] = (options: Meteor.LoginWithExternalServiceOptions, callback: LoginCallback) => {
		overrideLoginMethod(loginWithOAuthToken, [options], callback, loginWithOAuthTokenAndTOTP);
	};
};
