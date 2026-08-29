import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Google } from 'meteor/google-oauth';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { createOAuthTotpLoginMethod } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

type LoginWithGoogleOptions = LoginWithExternalServiceOptions & {
	loginUrlParameters?: {
		include_granted_scopes?: boolean;
		hd?: string;
	};
	prompt?: string;
};

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithGoogle(options?: LoginWithGoogleOptions, callback?: LoginCallback): void;
	}
}

const { loginWithGoogle } = Meteor;

const innerLoginWithGoogleAndTOTP = createOAuthTotpLoginMethod(Google);

const loginWithGoogleAndTOTP = (options: LoginWithGoogleOptions | undefined, code: string, callback?: LoginCallback) => {
	// a particular email domain. (Don't use it if restrictCreationByEmailDomain
	// is a function.) Note that all this does is change Google's UI ---
	// accounts-base/accounts_server.js still checks server-side that the server
	// has the proper email address after the OAuth conversation.
	if (typeof Accounts._options.restrictCreationByEmailDomain === 'string') {
		options = Object.assign({}, options || {});
		options.loginUrlParameters = Object.assign({}, options.loginUrlParameters || {});
		options.loginUrlParameters.hd = Accounts._options.restrictCreationByEmailDomain;
	}

	innerLoginWithGoogleAndTOTP(options, code, callback);
};

Meteor.loginWithGoogle = (options, callback) => {
	overrideLoginMethod(loginWithGoogle, [options], callback, loginWithGoogleAndTOTP);
};

Google.requestCredential = wrapRequestCredentialFn<Partial<OAuthConfiguration>, LoginWithGoogleOptions>(
	'google',
	({ config, loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();

		const scope = ['email', ...(options.requestPermissions || ['profile'])].join(' ');

		const loginUrlParameters: Record<string, any> = {
			...options.loginUrlParameters,
			...(options.requestOfflineToken !== undefined && {
				access_type: options.requestOfflineToken ? 'offline' : 'online',
			}),
			...((options.prompt || options.forceApprovalPrompt) && { prompt: options.prompt || 'consent' }),
			...(options.loginHint && { login_hint: options.loginHint }),
			response_type: 'code',
			client_id: config.clientId,
			scope,
			redirect_uri: OAuth._redirectUri('google', config),
			state: OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl),
		};

		Object.assign(loginUrlParameters, {
			response_type: 'code',
			client_id: config.clientId,
			scope,
			redirect_uri: OAuth._redirectUri('google', config),
			state: OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl),
		});
		const loginUrl = `https://accounts.google.com/o/oauth2/auth?${Object.keys(loginUrlParameters)
			.map((param) => `${encodeURIComponent(param)}=${encodeURIComponent(loginUrlParameters[param])}`)
			.join('&')}`;

		OAuth.launchLogin({
			loginService: 'google',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: { height: 600 },
		});
	},
);
