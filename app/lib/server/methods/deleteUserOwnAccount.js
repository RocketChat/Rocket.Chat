import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import s from 'underscore.string';

import { settings } from '../../../settings';
import { Users } from '../../../models';
import { deleteUser } from '../functions';

Meteor.methods({
	deleteUserOwnAccount(password) {
		check(password, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteUserOwnAccount' });
		}

		if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteUserOwnAccount' });
		}

		const userId = Meteor.userId();
		const user = Users.findOneById(userId);

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteUserOwnAccount' });
		}

		if (user.services && user.services.password && s.trim(user.services.password.bcrypt)) {
			const result = Accounts._checkPassword(user, {
				digest: password.toLowerCase(),
				algorithm: 'sha-256',
			});
			if (result.error) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', { method: 'deleteUserOwnAccount' });
			}
		} else if (user.username !== s.trim(password)) {
			throw new Meteor.Error('error-invalid-username', 'Invalid username', { method: 'deleteUserOwnAccount' });
		}

		Meteor.defer(function() {
			deleteUser(userId);
		});

		return true;
	},
});
