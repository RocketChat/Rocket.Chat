import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { settings } from '../../../settings';

Meteor.methods({
	checkRegistrationSecretURL(hash) {
		check(hash, String);

		return hash === settings.get('Accounts_RegistrationForm_SecretURL');
	},
});
