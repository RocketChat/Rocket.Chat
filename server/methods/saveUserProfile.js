import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { saveCustomFields, passwordPolicy } from '../../app/lib';
import { Users } from '../../app/models';
import { settings as rcSettings } from '../../app/settings';
import { twoFactorRequired } from '../../app/2fa/server/twoFactorRequired';
import { saveUserIdentity } from '../../app/lib/server/functions/saveUserIdentity';

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

Meteor.methods({
	saveUserProfile: twoFactorRequired(function(settings, customFields) {
		check(settings, Object);
		check(customFields, Match.Maybe(Object));

		if (!rcSettings.get('Accounts_AllowUserProfileChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'saveUserProfile',
			});
		}

		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveUserProfile',
			});
		}

		const user = Users.findOneById(this.userId);

		if (settings.realname || settings.username) {
			if (!saveUserIdentity(this.userId, {
				_id: this.userId,
				name: settings.realname,
				username: settings.username,
			})) {
				throw new Meteor.Error('error-could-not-save-identity', 'Could not save user identity', { method: 'saveUserProfile' });
			}
		}

		if (settings.statusText || settings.statusText === '') {
			Meteor.call('setUserStatus', null, settings.statusText);
		}

		if (settings.bio) {
			if (typeof settings.bio !== 'string' || settings.bio.length > 260) {
				throw new Meteor.Error('error-invalid-field', 'bio', {
					method: 'saveUserProfile',
				});
			}
			Users.setBio(user._id, settings.bio.trim());
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

			Accounts.setPassword(this.userId, settings.newPassword, {
				logout: false,
			});

			try {
				Meteor.call('removeOtherTokens');
			} catch (e) {
				Accounts._clearAllLoginTokens(this.userId);
			}
		}

		Users.setProfile(this.userId, {});

		if (customFields && Object.keys(customFields).length) {
			saveCustomFields(this.userId, customFields);
		}

		return true;
	}),
});
