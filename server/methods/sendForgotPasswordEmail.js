import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../app/models';
import { settings } from '../../app/settings/server';
import { SystemLogger } from '../lib/logger/system';

Meteor.methods({
	sendForgotPasswordEmail(to) {
		check(to, String);

		const email = to.trim().toLowerCase();

		const user = Users.findOneByEmailAddress(email, { fields: { _id: 1 } });

		if (!user) {
			return true;
		}

		if (user.services && !user.services.password) {
			if (!settings.get('Accounts_AllowPasswordChangeForOAuthUsers')) {
				return false;
			}
		}

		try {
			Accounts.sendResetPasswordEmail(user._id, email);
			return true;
		} catch (error) {
			SystemLogger.error(error);
		}
	},
});
