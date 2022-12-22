import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';

Accounts.registerLoginHandler('iframe', function (result) {
	if (!result.iframe) {
		return;
	}

	check(result.token, String);

	const user = Meteor.users.findOne({
		'services.iframe.token': result.token,
	});

	if (user) {
		return {
			userId: user._id,
		};
	}
});

Meteor.methods({
	'OAuth.retrieveCredential'(credentialToken, credentialSecret) {
		return OAuth.retrieveCredential(credentialToken, credentialSecret);
	},
});
