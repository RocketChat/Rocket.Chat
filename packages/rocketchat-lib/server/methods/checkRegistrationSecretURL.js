import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	checkRegistrationSecretURL(hash) {

		check(hash, String);

		return hash === RocketChat.settings.get('Accounts_RegistrationForm_SecretURL');
	},
});
