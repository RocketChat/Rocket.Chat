import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Google } from 'meteor/google-oauth';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { createOAuthTotpLoginMethod, credentialRequestCompleteHandler } from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { wrapRequestCredentialFn } from '../../lib/wrapRequestCredentialFn';

type LoginWithGoogleOptions = LoginWithExternalServiceOptions & {
	loginUrlParameters?: {
		include_granted_scopes?: boolean;
		hd?: string;
	};
	prompt?: string;
};

const requestCredential = wrapRequestCredentialFn<Partial<OAuthConfiguration>, LoginWithGoogleOptions>(
	'google',
	({ config, loginStyle, options, credentialRequestCompleteCallback }) => {
		const credentialToken = Random.secret();

		// Use Google's domain-specific login page if we want to restrict creation to
		// a particular email domain. (Don't use it if restrictCreationByEmailDomain
		// is a function.) Note that all this does is change Google's UI ---
		// accounts-base/accounts_server.js still checks server-side that the server
		// has the proper email address after the OAuth conversation.
		if (typeof Accounts._options.restrictCreationByEmailDomain === 'string') {
			options = { ...options, loginUrlParameters: { ...options.loginUrlParameters, hd: Accounts._options.restrictCreationByEmailDomain } };
		}

		const scope = ['email', ...(options.requestPermissions || ['profile'])].join(' ');

		const loginUrlParameters: Record<string, string | number | boolean> = {
			...options.loginUrlParameters,
			...(options.requestOfflineToken !== undefined && {
				access_type: options.requestOfflineToken ? 'offline' : 'online',
			}),
			...((options.prompt || options.forceApprovalPrompt) && { prompt: options.prompt || 'consent' }),
			...(options.loginHint && { login_hint: options.loginHint }),
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

const loginWithGoogle = (
	options: LoginWithGoogleOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	const credentialRequestCompleteCallback = credentialRequestCompleteHandler(callback);
	requestCredential(options, credentialRequestCompleteCallback);
};

const loginWithGoogleAndTOTP = createOAuthTotpLoginMethod<LoginWithGoogleOptions>({ requestCredential });

const loginWithGoogleForMeteor = (
	options: LoginWithGoogleOptions,
	callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
) => {
	overrideLoginMethod(loginWithGoogle, [options], callback, loginWithGoogleAndTOTP);
};

Object.assign(Google, { requestCredential });
Object.assign(Accounts._loginFuncs, { google: loginWithGoogleForMeteor });
Object.assign(Meteor, { loginWithGoogle: loginWithGoogleForMeteor });
