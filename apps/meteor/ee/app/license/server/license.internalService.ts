import type { ILicense } from '@rocket.chat/core-services';
import { api, ServiceClassInternal } from '@rocket.chat/core-services';

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
