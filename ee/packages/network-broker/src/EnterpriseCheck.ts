import type { ServiceSchema } from 'moleculer';

import { startLicenseEnforcement } from './licenseEnforcement';

export const EnterpriseCheck: ServiceSchema = {
	name: 'EnterpriseCheck',
	async started(): Promise<void> {
		// `this` is the host service, so `this.name` is the mixed-in service name
		this.stopLicenseEnforcement = startLicenseEnforcement({
			serviceName: this.name,
			nodeID: this.broker.nodeID,
			hasValidLicense: () => this.broker.call('license.hasValidLicense', ['scalability']),
			listServices: () => this.broker.call('$node.services', { skipInternal: true }),
			fatal: (message: string) => this.broker.fatal(message),
		});
	},
	async stopped(): Promise<void> {
		this.stopLicenseEnforcement?.();
	},
};
