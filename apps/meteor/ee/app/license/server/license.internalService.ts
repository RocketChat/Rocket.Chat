import { debounce } from 'underscore';

import { api } from '../../../../server/sdk/api';
import type { ILicense } from '../../../../server/sdk/types/ILicense';
import { ServiceClassInternal } from '../../../../server/sdk/types/ServiceClass';
import { guestPermissions } from '../../authorization/lib/guestPermissions';
import { resetEnterprisePermissions } from '../../authorization/server/resetEnterprisePermissions';
import { getModules, hasLicense, isEnterprise, onModule, onValidateLicenses } from './license';

export class LicenseService extends ServiceClassInternal implements ILicense {
	protected name = 'license';

	constructor() {
		super();

		onValidateLicenses((): void => {
			if (!isEnterprise()) {
				return;
			}

			api.broadcast('authorization.guestPermissions', guestPermissions);
			resetEnterprisePermissions();
		});

		onModule((licenseModule) => {
			api.broadcast('license.module', licenseModule);
		});

		/**
		 * The main idea is if there is no scalability module enabled,
		 * then we should not allow more than one service per environment.
		 * So we list the services and nodes, and if there is more than
		 * one, we inform the service that it should be disabled.
		 */
		const shutdownServices = debounce(async () => {
			if (hasLicense('scalability')) {
				return;
			}

			const services: {
				name: string;
				nodes: string[];
			}[] = await api.call('$node.services');

			// Filter only the duplicated services
			const duplicated = services.filter((service) => {
				return service.name !== '$node' && service.nodes.length > 1;
			});

			if (!duplicated.length) {
				return;
			}

			const brokers: Record<string, string[]> = Object.fromEntries(
				duplicated.map((service) => {
					// remove the first node from the list
					const [, ...nodes] = service.nodes;
					return [service.name, nodes];
				}),
			);

			const duplicatedServicesNames = duplicated.map((service) => service.name);

			// send shutdown signal to the duplicated services
			api.broadcastToServices(duplicatedServicesNames, 'shutdown', brokers);
		}, 1000);

		this.onEvent('$services.changed', async ({ localService }) => {
			// since this is an internal service, we can ignore this event if the service that triggered is a local service.
			// this will also prevent race conditions if a license is not in place when this process is starting up.
			if (localService) {
				return;
			}
			shutdownServices();
		});
	}

	async started(): Promise<void> {
		if (!isEnterprise()) {
			return;
		}

		api.broadcast('authorization.guestPermissions', guestPermissions);
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

	getGuestPermissions(): string[] {
		return guestPermissions;
	}
}
