import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

const LEGACY_MELD_RESET_REASON = 'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password';

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
				if (user.services?.[serviceName]?.id !== serviceData.id) {
					const normalizedEmail = serviceData.email.toLowerCase();
					const isEmailVerified = (user.emails ?? []).some(
						(email) => email.address?.toLowerCase() === normalizedEmail && email.verified === true,
					);

					if (user.services?.password && !isEmailVerified) {
						await Users.resetPasswordAndSetRequirePasswordChange(user._id, false, '');
					}

					await Users.setServiceId(user._id, serviceName, serviceData.id);
					await Users.setEmailVerified(user._id, serviceData.email);
				}

				if (
					user.requirePasswordChange === true &&
					!user.services?.password?.bcrypt &&
					user.requirePasswordChangeReason === LEGACY_MELD_RESET_REASON
				) {
					await Users.unsetRequirePasswordChange(user._id);
				}
			}
		}

		return orig_updateOrCreateUserFromExternalService.apply(this, [serviceName, serviceData, ...args]);
	};
}
