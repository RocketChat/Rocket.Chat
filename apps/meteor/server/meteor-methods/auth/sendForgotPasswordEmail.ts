import { Users } from '@rocket.chat/models';

import { sendResetPasswordEmail } from '../../lib/auth/accountEmails';
import { SystemLogger } from '../../lib/logger/system';
import { settings } from '../../settings';

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
		void sendResetPasswordEmail(user._id, email).catch((err) => SystemLogger.error({ err }));
		return true;
	} catch (err) {
		SystemLogger.error({ err });
	}
};
