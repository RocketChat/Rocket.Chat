import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

import { settings } from '../settings';

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
					const trustExternalEmail = Boolean(settings.get('Accounts_Verify_Email_For_External_Accounts'));
					const canOAuthUserChangePassword =
						Boolean(settings.get('Accounts_AllowPasswordChange')) && Boolean(settings.get('Accounts_AllowPasswordChangeForOAuthUsers'));

					if (user.services?.password && !isEmailVerified && !trustExternalEmail) {
						await Users.resetPasswordAndSetRequirePasswordChange(
							user._id,
							false,
							canOAuthUserChangePassword ? 'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password' : '',
						);
					}

					await Users.setServiceId(user._id, serviceName, serviceData.id);
					await Users.setEmailVerified(user._id, serviceData.email);
				} else if (user.requirePasswordChange === true && !user.services?.password?.bcrypt) {
					await Users.unsetRequirePasswordChange(user._id);
				}
			}
		}

		return orig_updateOrCreateUserFromExternalService.apply(this, [serviceName, serviceData, ...args]);
	};
}
