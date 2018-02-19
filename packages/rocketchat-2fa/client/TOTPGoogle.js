/* globals Google, overrideLoginMethod*/
import _ from 'underscore';

const loginWithGoogleAndTOTP = function(options, code, callback) {
	// support a callback without options
	if (!callback && typeof options === 'function') {
		callback = options;
		options = null;
	}

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
		options = _.extend({}, options || {});
		options.loginUrlParameters = _.extend({}, options.loginUrlParameters || {});
		options.loginUrlParameters.hd = Accounts._options.restrictCreationByEmailDomain;
	}

	const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback, code);
	Google.requestCredential(options, credentialRequestCompleteCallback);
};

const loginWithGoogle = Meteor.loginWithGoogle;
Meteor.loginWithGoogle = function(options, cb) {
	overrideLoginMethod(loginWithGoogle, [options], cb, loginWithGoogleAndTOTP);
};
