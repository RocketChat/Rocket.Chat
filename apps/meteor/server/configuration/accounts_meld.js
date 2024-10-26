import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';

export async function configureAccounts() {
	const orig_updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService;
	Accounts.updateOrCreateUserFromExternalService = async function (serviceName, serviceData = {}, ...args /* , options*/) {
		const services = ['facebook', 'github', 'gitlab', 'google', 'meteor-developer', 'linkedin', 'twitter', 'apple'];

		if (services.includes(serviceName) === false && serviceData._OAuthCustom !== true) {
			return orig_updateOrCreateUserFromExternalService.apply(this, [serviceName, serviceData, ...args]);
		}

		if (serviceName === 'meteor-developer') {
			if (Array.isArray(serviceData.emails)) {
				const primaryEmail = serviceData.emails.sort((a) => a.primary !== true).filter((item) => item.verified === true)[0];
				serviceData.email = primaryEmail && primaryEmail.address;
			}
		}

		if (serviceName === 'linkedin') {
			serviceData.email = serviceData.emailAddress;
		}

		if (serviceData.email) {
			const user = await Users.findOneByEmailAddress(serviceData.email);
			if (user != null && user.services?.[serviceName]?.id !== serviceData.id) {
				const findQuery = {
					address: serviceData.email,
					verified: true,
				};

				if (user.services?.password && !_.findWhere(user.emails, findQuery)) {
					await Users.resetPasswordAndSetRequirePasswordChange(
						user._id,
						true,
						'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password',
					);
				}

				await Users.setServiceId(user._id, serviceName, serviceData.id);
				await Users.setEmailVerified(user._id, serviceData.email);
			}
		}

		return orig_updateOrCreateUserFromExternalService.apply(this, [serviceName, serviceData, ...args]);
	};
}
