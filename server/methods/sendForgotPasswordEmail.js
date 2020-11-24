import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../app/models';
import { settings } from '../../app/settings/server';

Meteor.methods({
	sendForgotPasswordEmail(to) {
		check(to, String);

		const email = to.trim();

		const user = Users.findOneByEmailAddress(email, { fields: { _id: 1 } });

		if (!user) {
			return false;
		}

		if (user.services && !user.services.password) {
			if (!settings.get('Accounts_AllowPasswordChangeForOAuthUsers')) {
				return false;
			}
		}

		try {
			return !!Accounts.sendResetPasswordEmail(user._id, email);
		} catch (error) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, {
				method: 'registerUser',
				message: error.message,
			});
		}
	},
});
