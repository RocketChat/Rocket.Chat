import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

const AccessTokenServices: Record<
	string,
	{
		serviceName: string;
		handleAccessTokenRequest: (options: any) => Promise<{ serviceData: any; options: any }>;
	}
> = {};

export const registerAccessTokenService = function (
	serviceName: string,
	handleAccessTokenRequest: (options: any) => Promise<{ serviceData: any; options: any }>,
): void {
	AccessTokenServices[serviceName] = {
		serviceName,
		handleAccessTokenRequest,
	};
};

// Listen to calls to `login` with an oauth option set. This is where
// users actually get logged in to meteor via oauth.
Accounts.registerLoginHandler((options) => {
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
	return ServiceConfiguration.configurations.findOneAsync({ service: options.serviceName }).then((config) => {
		if (!config) {
			throw new Accounts.ConfigError();
		}

		if (!(Accounts.oauth.serviceNames() as string[]).includes(service.serviceName)) {
			// serviceName was not found in the registered services list.
			// This could happen because the service never registered itself or
			// unregisterService was called on it.
			return {
				type: 'oauth',
				error: new Meteor.Error(Accounts.LoginCancelledError.numericError, `No registered oauth service found for: ${service.serviceName}`),
			};
		}

		return service.handleAccessTokenRequest(options).then((oauthResult) => {
			return Accounts.updateOrCreateUserFromExternalService(service.serviceName, oauthResult.serviceData, oauthResult.options);
		});
	}) as any;
});
