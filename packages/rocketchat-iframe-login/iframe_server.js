/* globals Accounts */

Accounts.registerLoginHandler('iframe', function(result) {
	if (!result.iframe) {
		return;
	}

	console.log('[Method] registerLoginHandler');

	var user = Meteor.users.findOne({
		'services.iframe.token': result.token
	});

	if (user) {
		return {
			userId: user._id
		};
	}
});
