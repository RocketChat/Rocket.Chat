import { Accounts } from './accounts-base.ts';
import { Collection } from './mongo.ts';
import { Package } from './package-registry.ts';

export class ConfigError extends Error {
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

export const configurations = new Collection('meteor_accounts_loginServiceConfiguration', {
	_preventAutopublish: true,
	connection: Accounts.connection,
});

export const ServiceConfiguration = {
	configurations,
	ConfigError,
};

Package['service-configuration'] = {
	ServiceConfiguration,
};
