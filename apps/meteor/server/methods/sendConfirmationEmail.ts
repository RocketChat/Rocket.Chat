import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../app/models/server';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	sendConfirmationEmail(to) {
		check(to, String);

		methodDeprecationLogger.warn('sendConfirmationEmail will be deprecated in future versions of Rocket.Chat');

		const email = to.trim();

		const user = Users.findOneByEmailAddress(email, { fields: { _id: 1 } });

		if (!user) {
			return false;
		}

		try {
			Accounts.sendVerificationEmail(user._id, email);
			return true;
		} catch (error: any) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
				method: 'registerUser',
				message: error.message,
			});
		}
	},
});
