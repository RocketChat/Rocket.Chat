import { Users } from '@rocket.chat/models';

import { sendVerificationEmail } from '../../lib/auth/accountEmails';
import { SystemLogger } from '../../lib/logger/system';

export const sendConfirmationEmail = async (to: string): Promise<boolean> => {
	const email = to.trim();

	const user = await Users.findOneByEmailAddress(email, { projection: { emails: 1 } });
	if (!user) {
		return false;
	}

	// Do not re-send a verification mail to an address that is already verified.
	const target = user.emails?.find((e) => e.address.toLowerCase() === email.toLowerCase() && !e.verified);
	if (!target) {
		return false;
	}

	void sendVerificationEmail(user._id, target.address).catch((err) => SystemLogger.error({ err }));
	return true;
};
