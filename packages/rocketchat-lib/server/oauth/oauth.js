const AccessTokenServices = {};

RocketChat.registerAccessTokenService = function(serviceName, handleAccessTokenRequest) {
	AccessTokenServices[serviceName] = {
		serviceName: serviceName,
		handleAccessTokenRequest: handleAccessTokenRequest
	};
};

// Listen to calls to `login` with an oauth option set. This is where
// users actually get logged in to meteor via oauth.
Accounts.registerLoginHandler(function(options) {
	if (!options.accessToken) {
		return undefined; // don't handle
	}

	check(options, Match.ObjectIncluding({
		serviceName: String
	}));

	const service = AccessTokenServices[options.serviceName];

	// Skip everything if there's no service set by the oauth middleware
	if (!service) {
		throw new Error(`Unexpected AccessToken service ${options.serviceName}`);
	}

	// Make sure we're configured
	if (!ServiceConfiguration.configurations.findOne({service: service.serviceName})) {
		throw new ServiceConfiguration.ConfigError();
	}

	if (!_.contains(Accounts.oauth.serviceNames(), service.serviceName)) {
		// serviceName was not found in the registered services list.
		// This could happen because the service never registered itself or
		// unregisterService was called on it.
		return {
			type: 'oauth',
			error: new Meteor.Error(
				Accounts.LoginCancelledError.numericError,
				`No registered oauth service found for: ${service.serviceName}`
			)
		};
	}

	const oauthResult = service.handleAccessTokenRequest(options);

	return Accounts.updateOrCreateUserFromExternalService(service.serviceName, oauthResult.serviceData, oauthResult.options);
});



