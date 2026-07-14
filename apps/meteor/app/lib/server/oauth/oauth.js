import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

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
		throw new Meteor.Error('error-invalid-service', `Unexpected AccessToken service ${options.serviceName}`);
	}

	// Make sure we're configured
	const config = await ServiceConfiguration.configurations.findOneAsync({ service: options.serviceName });
	if (!config) {
		throw new Meteor.Error('error-service-not-configured', `Service ${options.serviceName} is not configured`);
	}

	const isRegistered = _.contains(Accounts.oauth.serviceNames(), service.serviceName);
	if (!isRegistered) {
		// serviceName was not found in the registered services list.
		// This could happen because the service never registered itself or
		// unregisterService was called on it.
		return {
			type: 'oauth',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, `No registered oauth service found for: ${service.serviceName}`),
		};
	}

	let oauthResult;
	try {
		oauthResult = await service.handleAccessTokenRequest(options);
	} catch (err) {
		throw new Meteor.Error('error-invalid-access-token', err.message);
	}

	return Accounts.updateOrCreateUserFromExternalService(service.serviceName, oauthResult.serviceData, oauthResult.options);
});
