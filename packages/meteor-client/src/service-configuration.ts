import { Accounts } from './accounts-base.ts';
import { DdpCollectionStore } from './ddp-collection-store.ts';

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

type LoginServiceConfiguration = {
	_id: string;
	service?: string;
	[key: string]: unknown;
};

const store = new DdpCollectionStore<LoginServiceConfiguration>('meteor_accounts_loginServiceConfiguration', Accounts.connection);

export const configurations = {
	findOne(selector: { service?: string } = {}): LoginServiceConfiguration | undefined {
		return store.findOne((doc) => selector.service === undefined || doc.service === selector.service);
	},
};

export const ServiceConfiguration = {
	configurations,
	ConfigError,
};
