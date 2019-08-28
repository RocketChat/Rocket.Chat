import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { saveCustomFields, passwordPolicy } from '../../app/lib';
import { Users } from '../../app/models';
import { settings as rcSettings } from '../../app/settings';

Meteor.methods({
	saveUserProfile(settings, customFields) {
		check(settings, Object);
		check(customFields, Match.Maybe(Object));

		if (!rcSettings.get('Accounts_AllowUserProfileChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'saveUserProfile',
			});
		}

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveUserProfile',
			});
		}

		const user = Users.findOneById(Meteor.userId());

		function checkPassword(user = {}, typedPassword) {
			if (!(user.services && user.services.password && user.services.password.bcrypt && user.services.password.bcrypt.trim())) {
				return true;
			}

			const passCheck = Accounts._checkPassword(user, {
				digest: typedPassword.toLowerCase(),
				algorithm: 'sha-256',
			});

			if (passCheck.error) {
				return false;
			}
			return true;
		}

		if (settings.realname) {
			Meteor.call('setRealName', settings.realname);
		}

		if (settings.username) {
			Meteor.call('setUsername', settings.username);
		}

		if (settings.statusText || settings.statusText === '') {
			Meteor.call('setUserStatus', null, settings.statusText);
		}

		if (settings.email) {
			if (!checkPassword(user, settings.typedPassword)) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', {
					method: 'saveUserProfile',
				});
			}

			Meteor.call('setEmail', settings.email);
		}

		// Should be the last check to prevent error when trying to check password for users without password
		if (settings.newPassword && rcSettings.get('Accounts_AllowPasswordChange') === true) {
			if (!checkPassword(user, settings.typedPassword)) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', {
					method: 'saveUserProfile',
				});
			}

			passwordPolicy.validate(settings.newPassword);

			Accounts.setPassword(Meteor.userId(), settings.newPassword, {
				logout: false,
			});
		}

		Users.setProfile(Meteor.userId(), {});

		if (customFields && Object.keys(customFields).length) {
			saveCustomFields(Meteor.userId(), customFields);
		}

		return true;
	},
});
