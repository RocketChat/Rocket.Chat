import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Google } from 'meteor/google-oauth';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';
import { createOAuthTotpLoginMethod } from './oauth';

declare module 'meteor/accounts-base' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Accounts {
		export const _options: {
			restrictCreationByEmailDomain?: string | (() => string);
			forbidClientAccountCreation?: boolean | undefined;
		};
	}
}

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithGoogle(
			options?:
				| Meteor.LoginWithExternalServiceOptions & {
						loginUrlParameters?: {
							include_granted_scopes?: boolean;
							hd?: string;
						};
				  },
			callback?: LoginCallback,
		): void;
	}
}

const { loginWithGoogle } = Meteor;

const innerLoginWithGoogleAndTOTP = createOAuthTotpLoginMethod(Google);

const loginWithGoogleAndTOTP = (
	options:
		| (Meteor.LoginWithExternalServiceOptions & {
				loginUrlParameters?: {
					include_granted_scopes?: boolean;
					hd?: string;
				};
		  })
		| undefined,
	code: string,
	callback?: LoginCallback,
) => {
	if (Meteor.isCordova && Google.signIn) {
		// After 20 April 2017, Google OAuth login will no longer work from
		// a WebView, so Cordova apps must use Google Sign-In instead.
		// https://github.com/meteor/meteor/issues/8253
		Google.signIn(options, callback);
		return;
	} // Use Google's domain-specific login page if we want to restrict creation to

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

Google.requestCredential = wrapRequestCredentialFn(
	'google',
	({ config, loginStyle, options: requestOptions, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();
		const options = requestOptions as Meteor.LoginWithExternalServiceOptions & {
			loginUrlParameters?: {
				include_granted_scopes?: boolean;
				hd?: string;
			};
			prompt?: string;
		};

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
