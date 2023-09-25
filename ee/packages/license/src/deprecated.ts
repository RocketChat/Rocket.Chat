import { licenseData } from './data';
import type { LicenseLimitKind } from './definition/ILicenseV3';
import { getLicense } from './license';
import { getModules } from './modules';

const getLicenseLimit = (kind: LicenseLimitKind) => {
	const license = getLicense();
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
	if (licenseData.valid && licenseData.unmodifiedLicense) {
		return {
			license: licenseData.unmodifiedLicense,
			modules: getModules(),
		};
	}
};
