import { Apps } from '@rocket.chat/core-services';

import type { ILicense, LicenseAppSources } from '../../definition/ILicense';
import { getInstallationSourceFromAppStorageItem } from '../../../../../lib/apps/getInstallationSourceFromAppStorageItem';

export async function isUnderAppLimits(licenseAppsConfig: NonNullable<ILicense['apps']>, source: LicenseAppSources): Promise<boolean> {
	const apps = await Apps.getApps({ enabled: true });

	if (!apps || !Array.isArray(apps)) {
		return true;
	}

	const storageItems = await Promise.all(apps.map((app) => Apps.getAppStorageItemById(app.id)));
	const activeAppsFromSameSource = storageItems.filter((item) => item && getInstallationSourceFromAppStorageItem(item) === source);

	const configKey = `max${source.charAt(0).toUpperCase()}${source.slice(1)}Apps` as keyof typeof licenseAppsConfig;
	const configLimit = licenseAppsConfig[configKey];

	// If the workspace can install unlimited apps
	// the config will be -1
	if (configLimit === -1) {
		return true;
	}

	return activeAppsFromSameSource.length < configLimit;
}
