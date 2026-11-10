import { ClientSafeError } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

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

	try {
		Accounts.sendVerificationEmail(user._id, target.address);
		return true;
	} catch (error: any) {
		throw new ClientSafeError('error-email-send-failed', `Error trying to send email: ${error.message}`, {
			method: 'registerUser',
			message: error.message,
		});
	}
};
