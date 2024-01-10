import { Accounts } from 'meteor/accounts-base';
import { Google } from 'meteor/google-oauth';
import { Meteor } from 'meteor/meteor';

import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { createOAuthTotpLoginMethod } from './oauth';

declare module 'meteor/accounts-base' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Accounts {
		export const _options: {
			restrictCreationByEmailDomain?: string | (() => string);
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
