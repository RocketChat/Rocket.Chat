import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

export const sendConfirmationEmail = async (to: string): Promise<boolean> => {
	check(to, String);

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
};

Meteor.methods<ServerMethods>({
	async sendConfirmationEmail(to) {
		methodDeprecationLogger.method('sendConfirmationEmail', '7.0.0');

		return sendConfirmationEmail(to);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'sendConfirmationEmail',
		userId() {
			return true;
		},
	},
	5,
	60000,
);
