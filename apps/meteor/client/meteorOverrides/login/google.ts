import { Accounts } from 'meteor/accounts-base';
import { Google } from 'meteor/google-oauth';
import { Meteor } from 'meteor/meteor';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';

declare module 'meteor/accounts-base' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Accounts {
		export const _options: {
			restrictCreationByEmailDomain?: string | (() => string);
		};
	}
}

const loginWithGoogleAndTOTP = (
	options?:
		| (Meteor.LoginWithExternalServiceOptions & {
				loginUrlParameters?: {
					include_granted_scopes?: boolean;
					hd?: string;
				};
		  })
		| null,
	code?: string,
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

	const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback, code);
	Google.requestCredential(options, credentialRequestCompleteCallback);
};

const { loginWithGoogle } = Meteor;

Meteor.loginWithGoogle = (options, callback) => {
	import('../../lib/2fa/overrideLoginMethod')
		.then(({ overrideLoginMethod }) => {
			overrideLoginMethod(loginWithGoogle, [options], callback, loginWithGoogleAndTOTP);
		})
		.catch(callback);
};
