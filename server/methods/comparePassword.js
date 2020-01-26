import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { SHA256 } from 'meteor/sha';
import bcrypt from 'bcrypt';

import { settings as rcSettings } from '../../app/settings';
import { Users } from '../../app/models';

Meteor.methods({
	comparePassword(password) {
		check(password, String);

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

		if (!user.services || !user.services.password || (!user.services.password.bcrypt && !user.services.password.srp)) {
			return true;
		}

		const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);
		const formattedPassword = SHA256(password).toLowerCase();
		const hash = user.services.password.bcrypt;

		if (bcryptCompare(formattedPassword, hash)) {
			return false;
		}
		return true;
	},
});
