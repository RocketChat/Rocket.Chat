import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Google } from 'meteor/google-oauth';
import { Meteor } from 'meteor/meteor';

import {
	createOAuthTotpLoginMethod,
	credentialRequestCompleteHandler,
	launchLogin,
	redirectUri,
	stateParam,
	wrapRequestCredentialFn,
} from './oauth';
import type { LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';

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

		const loginUrl = new URL('https://accounts.google.com/o/oauth2/auth');
		if (options.loginUrlParameters) {
			for (const [key, value] of Object.entries(options.loginUrlParameters)) {
				loginUrl.searchParams.append(key, String(value));
			}
		}
		// Use Google's domain-specific login page if we want to restrict creation to
		// a particular email domain. (Don't use it if restrictCreationByEmailDomain
		// is a function.) Note that all this does is change Google's UI ---
		// accounts-base/accounts_server.js still checks server-side that the server
		// has the proper email address after the OAuth conversation.
		if (typeof Accounts._options.restrictCreationByEmailDomain === 'string') {
			loginUrl.searchParams.set('hd', Accounts._options.restrictCreationByEmailDomain);
		}
		if (options.requestOfflineToken !== undefined)
			loginUrl.searchParams.append('access_type', options.requestOfflineToken ? 'offline' : 'online');
		if (options.prompt || options.forceApprovalPrompt) loginUrl.searchParams.append('prompt', options.prompt || 'consent');
		if (options.loginHint) loginUrl.searchParams.append('login_hint', options.loginHint);
		loginUrl.searchParams.append('response_type', 'code');
		loginUrl.searchParams.append('client_id', config.clientId ?? '');
		loginUrl.searchParams.append('scope', ['email', ...(options.requestPermissions || ['profile'])].join(' '));
		loginUrl.searchParams.append('redirect_uri', redirectUri('google', config));
		loginUrl.searchParams.append('state', stateParam(loginStyle, credentialToken, options.redirectUrl));

		launchLogin({
			loginService: 'google',
			loginStyle,
			loginUrl: loginUrl.toString(),
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
