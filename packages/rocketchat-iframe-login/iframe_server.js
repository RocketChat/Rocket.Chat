/* globals Accounts, OAuth */

Accounts.registerLoginHandler('iframe', function(result) {
	if (!result.iframe) {
		return;
	}

	console.log('[Method] registerLoginHandler');

	const user = Meteor.users.findOne({
		'services.iframe.token': result.token
	});

	if (user) {
		return {
			userId: user._id
		};
	}
});


Meteor.methods({
	'OAuth.retrieveCredential'(credentialToken, credentialSecret) {
		return OAuth.retrieveCredential(credentialToken, credentialSecret);
	}
});
