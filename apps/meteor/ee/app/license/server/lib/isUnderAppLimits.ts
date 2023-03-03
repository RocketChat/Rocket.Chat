import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { Apps } from '@rocket.chat/core-services';

import type { ILicense, LicenseAppSources } from '../../definition/ILicense';

export async function isUnderAppLimits(licenseAppsConfig: NonNullable<ILicense['apps']>, source: LicenseAppSources): Promise<boolean> {
	const apps = Apps.getApp({ enabled: true }).filter((app: IAppInfo) => Apps.getStorageItemById(app.id).installationSource === source);
	const configKey = `max${source.charAt(0).toUpperCase()}${source.slice(1)}Apps` as keyof typeof licenseAppsConfig;
	const configLimit = licenseAppsConfig[configKey];

	// If the workspace can install unlimited apps
	// the config will be -1
	if (configLimit === -1) {
		return true;
	}

	return apps.length < configLimit;
}
