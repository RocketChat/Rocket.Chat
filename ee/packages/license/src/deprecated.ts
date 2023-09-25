import type { LicenseLimitKind } from './definition/ILicenseV3';
import { LicenseManager } from './license';
import { getModules } from './modules';

const getLicenseLimit = (kind: LicenseLimitKind) => {
	const manager = LicenseManager.getLicenseManager();

	const license = manager.getLicense();
	if (!license) {
		return;
	}

	const limitList = license.limits[kind];
	if (!limitList?.length) {
		return;
	}

	return Math.min(...limitList.map(({ max }) => max));
};

// #TODO: Remove references to those functions

export const getMaxActiveUsers = () => getLicenseLimit('activeUsers') ?? 0;

export const getAppsConfig = () => ({
	maxPrivateApps: getLicenseLimit('privateApps') ?? -1,
	maxMarketplaceApps: getLicenseLimit('marketplaceApps') ?? -1,
});

export const getUnmodifiedLicenseAndModules = () => {
	const manager = LicenseManager.getLicenseManager();

	if (manager.valid && manager.unmodifiedLicense) {
		return {
			license: manager.unmodifiedLicense,
			modules: getModules(),
		};
	}
};
