/* globals Tokenly */

Accounts.oauth.registerService('tokenly');

if (Meteor.isClient) {
	const loginWithTokenly = function(options, callback) {
		if (! callback && typeof options === 'function') {
			callback = options;
			options = null;
		}

		Tokenly.requestCredential(options, Accounts.oauth.credentialRequestCompleteHandler(callback));
	};

	Accounts.registerClientLoginFunction('tokenly', loginWithTokenly);

	Meteor.loginWithTokenly = function() {
		return Accounts.applyLoginFunction('tokenly', arguments);
	};
} else {
	Accounts.addAutopublishFields({
		forLoggedInUser: ['services.tokenly'],
		forOtherUsers: ['services.tokenly.username']
	});
}
