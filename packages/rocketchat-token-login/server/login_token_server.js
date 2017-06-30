/* globals Accounts */

Accounts.registerLoginHandler('login-token', function(result) {
	if (!result.loginToken) {
		return;
	}

	const user = Meteor.users.findOne({
		'services.loginToken.token': result.loginToken
	});

	if (user) {
		Meteor.users.update({_id: user._id}, {$unset: {'services.loginToken': 1}});

		return {
			userId: user._id
		};
	}
});
