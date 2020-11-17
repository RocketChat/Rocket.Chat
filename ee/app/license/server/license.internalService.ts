import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { api } from '../../../../server/sdk/api';
import { ILicense } from '../../../../server/sdk/types/ILicense';
import { hasLicense, isEnterprise, getModules, onValidateLicenses, onModule } from './license';
import { resetEnterprisePermissions } from '../../authorization/server/resetEnterprisePermissions';
import { Authorization } from '../../../../server/sdk';
import { guestPermissions } from '../../authorization/lib/guestPermissions';

class LicenseService extends ServiceClass implements ILicense {
	protected name = 'license';

	protected internal = true;

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

api.registerService(new LicenseService());
