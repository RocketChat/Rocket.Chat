import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

// Reason stored by older versions when an external login was melded into an account with an unverified email
const UNVERIFIED_EMAIL_REASON = 'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password';

const isSameEmailAddress = (a, b) => typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase();

export async function configureAccounts() {
	const orig_updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService;
	Accounts.updateOrCreateUserFromExternalService = async function (serviceName, serviceData = {}, ...args /* , options*/) {
		const services = ['github', 'gitlab', 'google', 'apple'];

		if (services.includes(serviceName) === false && serviceData._OAuthCustom !== true) {
			return orig_updateOrCreateUserFromExternalService.apply(this, [serviceName, serviceData, ...args]);
		}

		if (serviceData.email) {
			const user = await Users.findOneByEmailAddress(serviceData.email);
			if (user != null) {
				// the lookup above is case insensitive, so the comparison here must be too
				// and the same address can be listed more than once, so check every copy
				const matchingEmails = user.emails?.filter(({ address }) => isSameEmailAddress(address, serviceData.email)) ?? [];
				const isEmailVerified = matchingEmails.some(({ verified }) => verified === true);

				if (user.services?.[serviceName]?.id !== serviceData.id) {
					if (user.services?.password && !isEmailVerified) {
						// Nobody proved ownership of this address, so the local password can't be trusted: drop it and
						// let the external service be the way in. Requiring a password change here would trap the user,
						// since there is no longer a password to change (and OAuth users may not be allowed to set one).
						await Users.unsetPassword(user._id);
					}

					await Users.setServiceId(user._id, serviceName, serviceData.id);
					await Users.setEmailVerified(user._id, matchingEmails[0]?.address ?? serviceData.email);
				}

				// Release accounts that older versions locked on the reset password page after melding. A reset or enroll
				// token can leave services.password without a usable hash, so check the hash; the write re-checks both
				// conditions, so a password change required for another reason in the meantime is kept.
				if (
					user.requirePasswordChange &&
					user.requirePasswordChangeReason === UNVERIFIED_EMAIL_REASON &&
					!user.services?.password?.bcrypt
				) {
					await Users.unsetRequirePasswordChangeWithoutPassword(user._id, UNVERIFIED_EMAIL_REASON);
				}
			}
		}

		return orig_updateOrCreateUserFromExternalService.apply(this, [serviceName, serviceData, ...args]);
	};
}
