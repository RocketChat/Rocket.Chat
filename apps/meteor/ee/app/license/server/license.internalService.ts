import type { ILicense } from '@rocket.chat/core-services';
import { api, ServiceClassInternal } from '@rocket.chat/core-services';
import { type LicenseModule } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import { guestPermissions } from '../../authorization/lib/guestPermissions';
import { resetEnterprisePermissions } from '../../authorization/server/resetEnterprisePermissions';

export class LicenseService extends ServiceClassInternal implements ILicense {
	protected name = 'license';

	constructor() {
		super();

		License.onValidateLicense((): void => {
			if (!License.hasValidLicense()) {
				return;
			}

			void api.broadcast('authorization.guestPermissions', guestPermissions);
			void resetEnterprisePermissions();
		});

		License.onModule((licenseModule) => {
			void api.broadcast('license.module', licenseModule);
		});

		this.onEvent('license.actions', (preventedActions) => License.syncShouldPreventActionResults(preventedActions));

		this.onEvent('license.sync', () => License.sync());
	}

	async started(): Promise<void> {
		if (!License.hasValidLicense()) {
			return;
		}

		void api.broadcast('authorization.guestPermissions', guestPermissions);
		await resetEnterprisePermissions();
	}

	hasModule(feature: LicenseModule): boolean {
		return License.hasModule(feature);
	}

	hasValidLicense(): boolean {
		return License.hasValidLicense();
	}

	getModules(): string[] {
		return License.getModules();
	}

	getGuestPermissions(): string[] {
		return guestPermissions;
	}
}
