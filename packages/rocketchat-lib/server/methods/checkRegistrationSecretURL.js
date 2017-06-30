Meteor.methods({
	checkRegistrationSecretURL(hash) {

		check(hash, String);

		return hash === RocketChat.settings.get('Accounts_RegistrationForm_SecretURL');
	}
});
