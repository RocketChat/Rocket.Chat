import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { SHA256 } from 'meteor/sha';
import bcrypt from 'bcrypt';

import { settings as rcSettings } from '../../app/settings';
import { Users } from '../../app/models';

Meteor.methods({

	/**
     * Check if the current user's password is the same of given password.
     * @returns True when the given password is not equal to current password.
     */
	comparePassword(password) {
		check(password, String);

		// Basic checks
		if (!rcSettings.get('Accounts_AllowUserProfileChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'comparePassword',
			});
		}

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'comparePassword',
			});
		}

		const user = Users.findOneById(Meteor.userId());

		if (!user.services || !user.services.password
            || (!user.services.password.bcrypt && !user.services.password.srp)) {
			// User has no password set
			return true;
		}

		const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);
		const formattedPassword = SHA256(password).toLowerCase();
		const hash = user.services.password.bcrypt;

		// Compare if given password is equal to the current
		if (bcryptCompare(formattedPassword, hash)) {
			// I could throw error
			// throw new Meteor.Error('error-same-password', 'Could not change password. The provided password is the same as your current password.', {
			//     method: 'comparePassword',
			// });

			return false;
		}

		return true;
	},
});
