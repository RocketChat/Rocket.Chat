import type { Service, ServiceSchema } from 'moleculer';

import { startLicenseEnforcement } from './licenseEnforcement';

type EnterpriseCheckService = Service & { stopLicenseEnforcement?: () => void };

export const EnterpriseCheck: ServiceSchema = {
	name: 'EnterpriseCheck',
	async started(this: EnterpriseCheckService): Promise<void> {
		// `this` is the host service, so `this.name` is the mixed-in service name
		this.stopLicenseEnforcement = startLicenseEnforcement({
			serviceName: this.name,
			nodeID: this.broker.nodeID,
			hasValidLicense: () => this.broker.call('license.hasValidLicense', ['scalability']),
			listServices: () => this.broker.call('$node.services', { skipInternal: true }),
			fatal: (message: string) => this.broker.fatal(message),
		});
	},
	async stopped(this: EnterpriseCheckService): Promise<void> {
		this.stopLicenseEnforcement?.();
	},
};
