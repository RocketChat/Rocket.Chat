/* globals Tokenly */
'use strict';

Accounts.oauth.registerService('tokenly');

if (Meteor.isClient) {
	const loginWithTokenly = function(options, callback) {
		if (! callback && typeof options === 'function') {
			callback = options;
			options = null;
		}

		const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
		Tokenly.requestCredential(options, credentialRequestCompleteCallback);
	};
	Accounts.registerClientLoginFunction('tokenly', loginWithTokenly);
	Meteor.loginWithTokenly = function() {
		return Accounts.applyLoginFunction('tokenly', arguments);
	};
} else {
	Accounts.addAutopublishFields({
		// not sure whether the tokenpass api can be used from the browser,
		// thus not sure if we should be sending access tokens; but we do it
		// for all other oauth2 providers, and it may come in handy.
		forLoggedInUser: ['services.tokenly'],
		forOtherUsers: ['services.tokenly.username']
	});
}
