import { Accounts } from './accounts-base.ts';
import { Mongo } from './mongo.ts';
import { Package } from './package-registry.ts';

class ConfigError extends Error {
	constructor(serviceName?: string) {
		super();
		this.name = 'ServiceConfiguration.ConfigError';

		if (!Accounts.loginServicesConfigured()) {
			this.message = 'Login service configuration not yet loaded';
		} else if (serviceName) {
			this.message = `Service ${serviceName} not configured`;
		} else {
			this.message = 'Service not configured';
		}
	}
}

const ServiceConfiguration = {
	configurations: new Mongo.Collection('meteor_accounts_loginServiceConfiguration', {
		_preventAutopublish: true,
		connection: Accounts.connection,
	}),
	ConfigError,
};

export { ServiceConfiguration };

Package['service-configuration'] = {
	ServiceConfiguration,
};
