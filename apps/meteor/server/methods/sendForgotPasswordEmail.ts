import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../app/settings/server';
import { SystemLogger } from '../lib/logger/system';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendForgotPasswordEmail(to: string): boolean | undefined;
	}
}

export const sendForgotPasswordEmail = async (to: string): Promise<boolean | undefined> => {
	const email = to.trim().toLowerCase();

	const user = await Users.findOneByEmailAddress(email, { projection: { _id: 1, services: 1 } });

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
};

Meteor.methods<ServerMethods>({
	async sendForgotPasswordEmail(to) {
		check(to, String);

		return sendForgotPasswordEmail(to);
	},
});
