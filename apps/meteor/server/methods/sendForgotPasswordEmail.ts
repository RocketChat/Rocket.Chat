import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Users } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { SystemLogger } from '../lib/logger/system';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendForgotPasswordEmail(to: string): boolean | undefined;
	}
}

Meteor.methods<ServerMethods>({
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
