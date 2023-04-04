import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Users } from '@rocket.chat/models';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods<ServerMethods>({
	async sendConfirmationEmail(to) {
		check(to, String);

		methodDeprecationLogger.warn('sendConfirmationEmail will be deprecated in future versions of Rocket.Chat');

		const email = to.trim();

		const user = await Users.findOneByEmailAddress(email, { projection: { _id: 1 } });

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
