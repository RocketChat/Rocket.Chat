import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { SHA256 } from 'meteor/sha';
import bcrypt from 'bcrypt';

import { Users } from '../../app/models';
import { passwordPolicy } from '../../app/lib';

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

		const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);
		const formattedPassword = SHA256(password).toLowerCase();
		const hash = user.services.password.bcrypt;

		if (bcryptCompare(formattedPassword, hash)) {
			throw new Meteor.Error('error-entered-password-same-as-current-password', 'Entered password same as current password', {
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
