import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { createOAuthTotpLoginMethod } from './oauth';
import type { IOAuthProvider } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithGoogle(
			options?: Meteor.LoginWithExternalServiceOptions & {
				loginUrlParameters?: {
					include_granted_scopes?: boolean;
					hd?: string;
				};
			},
			callback?: LoginCallback,
		): void;
	}
}

type GoogleProvider = IOAuthProvider & {
	signIn?: (options: Meteor.LoginWithExternalServiceOptions | undefined, callback?: LoginCallback) => void;
};

const requestCredential = wrapRequestCredentialFn(
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

// Cordova-only Google Sign-In flow (`plugins.googleplus`) is intentionally
// not implemented in the web client — Rocket.Chat web doesn't bundle the
// cordova plugin, so the Cordova branch below is a no-op.
const Google: GoogleProvider = {
	name: 'google',
	requestCredential,
};

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
		Google.signIn(options, callback);
		return;
	}

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
