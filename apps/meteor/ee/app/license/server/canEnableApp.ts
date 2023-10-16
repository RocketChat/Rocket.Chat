import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { Apps } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { getInstallationSourceFromAppStorageItem } from '../../../../lib/apps/getInstallationSourceFromAppStorageItem';

export const canEnableApp = async (app: IAppStorageItem): Promise<boolean> => {
	if (!(await Apps.isInitialized())) {
		return false;
	}

	// Migrated apps were installed before the validation was implemented
	// so they're always allowed to be enabled
	if (app.migrated) {
		return true;
	}

	const source = getInstallationSourceFromAppStorageItem(app);
	switch (source) {
		case 'private':
			return !(await License.shouldPreventAction('privateApps'));
		default:
			return !(await License.shouldPreventAction('marketplaceApps'));
	}
};
