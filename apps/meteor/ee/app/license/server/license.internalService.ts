import type { ILicense } from '@rocket.chat/core-services';
import { api, ServiceClassInternal } from '@rocket.chat/core-services';
import { getModules, hasModule, isEnterprise, onModule, onValidateLicense, type LicenseModule } from '@rocket.chat/license';

import { guestPermissions } from '../../authorization/lib/guestPermissions';
import { resetEnterprisePermissions } from '../../authorization/server/resetEnterprisePermissions';

export class LicenseService extends ServiceClassInternal implements ILicense {
	protected name = 'license';

	constructor() {
		super();

		onValidateLicense((): void => {
			if (!isEnterprise()) {
				return;
			}

			void api.broadcast('authorization.guestPermissions', guestPermissions);
			void resetEnterprisePermissions();
		});

		onModule((licenseModule) => {
			void api.broadcast('license.module', licenseModule);
		});
	}

	async started(): Promise<void> {
		if (!isEnterprise()) {
			return;
		}

		void api.broadcast('authorization.guestPermissions', guestPermissions);
		await resetEnterprisePermissions();
	}

	hasLicense(feature: LicenseModule): boolean {
		return hasModule(feature);
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
