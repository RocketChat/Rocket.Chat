import { ServiceClassInternal } from '../../../../server/sdk/types/ServiceClass';
import { api } from '../../../../server/sdk/api';
import { ILicense } from '../../../../server/sdk/types/ILicense';
import { hasLicense, isEnterprise, getModules, onValidateLicenses, onModule } from './license';
import { resetEnterprisePermissions } from '../../authorization/server/resetEnterprisePermissions';
import { Authorization } from '../../../../server/sdk';
import { guestPermissions } from '../../authorization/lib/guestPermissions';

export class LicenseService extends ServiceClassInternal implements ILicense {
	protected name = 'license';

	constructor() {
		super();

		onValidateLicenses((): void => {
			if (!isEnterprise()) {
				return;
			}

			Authorization.addRoleRestrictions('guest', guestPermissions);
			resetEnterprisePermissions();
		});

		onModule((licenseModule) => {
			api.broadcast('license.module', licenseModule);
		});

		this.onEvent('$services.changed', async () => {
			// if (hasModule('scalability')) {
			// 	return;
			// }

			const services: {
				name: string;
				nodes: string[];
			}[] = await api.call('$node.services');

			// console.log('services ->', services);

			/* The main idea is if there is no scalability module enabled,
			 * then we should not allow more than one service per environment.
			 * So we list the services and the nodes, and if there is more than
			 * one, we inform the service that it should be disabled.
			 */

			// Filter only the services are duplicated
			const duplicated = services.filter((service) => {
				return service.name !== '$node' && service.nodes.length > 1;
			});

			console.log('duplicated ->', duplicated);

			if (!duplicated.length) {
				return;
			}

			const brokers: Record<string, string[]> = Object.fromEntries(
				duplicated.map((service) => {
					const [, ...nodes] = service.nodes;
					return [service.name, nodes];
				}),
			);

			console.log('brokers ->', brokers);

			// Just inform the service that it should be disabled

			const duplicatedServicesNames = duplicated.map((service) => service.name);
			api.broadcastToServices(duplicatedServicesNames, 'shutdown', brokers);
		});
	}

	async started(): Promise<void> {
		if (!isEnterprise()) {
			return;
		}

		Authorization.addRoleRestrictions('guest', guestPermissions);
		resetEnterprisePermissions();
	}

	hasLicense(feature: string): boolean {
		return hasLicense(feature);
	}

	isEnterprise(): boolean {
		return isEnterprise();
	}

	getModules(): string[] {
		return getModules();
	}
}
