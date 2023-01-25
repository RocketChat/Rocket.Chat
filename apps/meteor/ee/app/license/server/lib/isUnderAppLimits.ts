import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import type { ILicense, LicenseAppSources } from '../../definitions/ILicense';

export async function isUnderAppLimits(
	{ appManager }: { appManager: AppManager },
	licenseAppsConfig: NonNullable<ILicense['apps']>,
	source: LicenseAppSources,
): Promise<boolean> {
	const apps = appManager.get({ enabled: true });
	const configKey = `max${source.charAt(0).toUpperCase()}${source.slice(1)}Apps` as keyof typeof licenseAppsConfig;
	const configLimit = licenseAppsConfig[configKey];

	// If the workspace can install unlimited apps
	// the config will be -1
	if (configLimit === -1) {
		return true;
	}

	return apps.length < configLimit;
}
