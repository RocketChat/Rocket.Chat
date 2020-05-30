import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../app/models/server';
import { passwordPolicy } from '../../app/lib/server';
import { compareUserPassword } from '../lib/compareUserPassword';

Meteor.methods({
	setUserPassword(password) {
		check(password, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserPassword',
			});
		}

		const user = Users.findOneById(userId);

		if (user && user.requirePasswordChange !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserPassword',
			});
		}

		if (compareUserPassword(user, { plain: password })) {
			throw new Meteor.Error('error-password-same-as-current', 'Entered password same as current password', {
				method: 'setUserPassword',
			});
		}

		passwordPolicy.validate(password);

		Accounts.setPassword(userId, password, {
			logout: false,
		});

		return Users.unsetRequirePasswordChange(userId);
	},
});
