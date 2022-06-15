import _ from 'underscore';
import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../app/models';

const orig_updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService;

Accounts.updateOrCreateUserFromExternalService = function (serviceName, serviceData = {}, ...args /* , options*/) {
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
		const user = Users.findOneByEmailAddress(serviceData.email);
		if (user != null) {
			const findQuery = {
				address: serviceData.email,
				verified: true,
			};

			if (user.services?.password && !_.findWhere(user.emails, findQuery)) {
				Users.resetPasswordAndSetRequirePasswordChange(
					user._id,
					true,
					'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password',
				);
			}

			Users.setServiceId(user._id, serviceName, serviceData.id);
			Users.setEmailVerified(user._id, serviceData.email);
		}
	}

	return orig_updateOrCreateUserFromExternalService.apply(this, [serviceName, serviceData, ...args]);
};
