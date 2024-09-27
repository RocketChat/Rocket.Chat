import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { Apps } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { getInstallationSourceFromAppStorageItem } from '../../../../lib/apps/getInstallationSourceFromAppStorageItem';

export const canEnableApp = async (app: IAppStorageItem): Promise<void> => {
	if (!(await Apps.isInitialized())) {
		throw new Error('apps-engine-not-initialized');
	}

	// Migrated apps were installed before the validation was implemented
	// so they're always allowed to be enabled
	if (app.migrated) {
		return;
	}

	if (app.info.addon && !License.hasValidAddon(app.info.addon)) {
		throw new Error('app-addon-not-valid');
	}

	const source = getInstallationSourceFromAppStorageItem(app);
	switch (source) {
		case 'private':
			if (await License.shouldPreventAction('privateApps')) {
				throw new Error('license-prevented');
			}

			break;
		default:
			if (await License.shouldPreventAction('marketplaceApps')) {
				throw new Error('license-prevented');
			}

			if (app.marketplaceInfo?.isEnterpriseOnly && !License.hasValidLicense()) {
				throw new Error('invalid-license');
			}

			break;
	}
};
