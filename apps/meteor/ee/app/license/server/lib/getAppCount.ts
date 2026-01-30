import { Apps } from '@rocket.chat/core-services';
import type { LicenseAppSources } from '@rocket.chat/core-typings';

import { getInstallationSourceFromAppStorageItem } from '../../../../../lib/apps/getInstallationSourceFromAppStorageItem';

export async function getAppCount(source: LicenseAppSources): Promise<number> {
	if (!(await Apps.isInitialized())) {
		return 0;
	}

	const apps = await Apps.getApps({ enabled: true });

	if (!apps || !Array.isArray(apps)) {
		return 0;
	}

	const storageItems = await Promise.all(apps.map((app) => Apps.getAppStorageItemById(app.id)));
	const activeAppsFromSameSource = storageItems.filter((item) => item && getInstallationSourceFromAppStorageItem(item) === source);

	return activeAppsFromSameSource.length;
}
