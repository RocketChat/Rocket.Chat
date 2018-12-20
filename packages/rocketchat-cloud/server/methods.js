import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	'cloud:retrieveRegistrationInfo'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'retrieveCloudRegistrationInfo' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'retrieveCloudRegistrationInfo' });
		}

		const info = {
			canConnect: RocketChat.settings.get('Register_Server'),
			token: '',
			email: '',
		};

		const firstUser = RocketChat.models.Users.getOldest({ emails: 1 });
		info.email = firstUser && firstUser.emails[0].address;

		if (RocketChat.models.Settings.findOne('Organization_Email')) {
			info.email = RocketChat.settings.get('Organization_Email');
		}

		return info;
	},
	'cloud:updateEmail'(email) {
		check(email, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'retrieveCloudRegistrationInfo' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'retrieveCloudRegistrationInfo' });
		}

		RocketChat.models.Settings.updateValueById('Organization_Email', email);
	},
	'cloud:connectServer'(token) {
		check(token, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'retrieveCloudRegistrationInfo' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'retrieveCloudRegistrationInfo' });
		}
	},
});
