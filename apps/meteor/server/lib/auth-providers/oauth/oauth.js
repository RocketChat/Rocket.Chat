import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

const AccessTokenServices = {};

export const registerAccessTokenService = function (serviceName, handleAccessTokenRequest) {
	AccessTokenServices[serviceName] = {
		serviceName,
		handleAccessTokenRequest,
	};
};

// Listen to calls to `login` with an oauth option set. This is where
// users actually get logged in to meteor via oauth.
Accounts.registerLoginHandler(async (options) => {
	if (!options.accessToken) {
		return undefined; // don't handle
	}

	check(
		options,
		Match.ObjectIncluding({
			serviceName: String,
		}),
	);

	const service = AccessTokenServices[options.serviceName];

	// Skip everything if there's no service set by the oauth middleware
	if (!service) {
		throw new Error(`Unexpected AccessToken service ${options.serviceName}`);
	}

	// Make sure we're configured
	if (!(await ServiceConfiguration.configurations.findOneAsync({ service: options.serviceName }))) {
		throw new Accounts.ConfigError();
	}

	if (!Accounts.oauth.serviceNames().includes(service.serviceName)) {
		// serviceName was not found in the registered services list.
		// This could happen because the service never registered itself or
		// unregisterService was called on it.
		return {
			type: 'oauth',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, `No registered oauth service found for: ${service.serviceName}`),
		};
	}

	const oauthResult = await service.handleAccessTokenRequest(options);

	return Accounts.updateOrCreateUserFromExternalService(service.serviceName, oauthResult.serviceData, oauthResult.options);
});
