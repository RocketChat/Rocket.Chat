import { Apps } from '@rocket.chat/core-services';

import type { ILicense, LicenseAppSources } from '../../definition/ILicense';

export async function isUnderAppLimits(licenseAppsConfig: NonNullable<ILicense['apps']>, source: LicenseAppSources): Promise<boolean> {
	const apps = await Apps.getApp({ enabled: true });

	if (!apps || !Array.isArray(apps)) {
		return true;
	}

	const promisedStorageItems = apps.map(async (app) => Apps.getAppStorageItemById(app.id));
	const activeAppsFromSameSource = await Promise.all(promisedStorageItems).then((items) =>
		items.filter((item) => item && item.installationSource === source),
	);

	const configKey = `max${source.charAt(0).toUpperCase()}${source.slice(1)}Apps` as keyof typeof licenseAppsConfig;
	const configLimit = licenseAppsConfig[configKey];

	// If the workspace can install unlimited apps
	// the config will be -1
	if (configLimit === -1) {
		return true;
	}

	return activeAppsFromSameSource.length < configLimit;
}
