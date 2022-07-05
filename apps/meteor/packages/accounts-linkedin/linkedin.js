import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Linkedin } from 'meteor/pauli:linkedin-oauth';

Accounts.oauth.registerService('linkedin');

if (Meteor.isClient) {
	const loginWithLinkedin = function (options, callback) {
		// support a callback without options
		if (!callback && typeof options === 'function') {
			callback = options;
			options = null;
		}
		const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
		Linkedin.requestCredential(options, credentialRequestCompleteCallback);
	};
	Accounts.registerClientLoginFunction('linkedin', loginWithLinkedin);

	Meteor.loginWithLinkedin = (...args) => Accounts.applyLoginFunction('linkedin', args);
} else {
	Accounts.addAutopublishFields({
		forLoggedInUser: ['services.linkedin'],
	});
}
