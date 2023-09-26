import type { ILicenseV3, LicenseLimitKind } from './definition/ILicenseV3';
import type { LicenseManager } from './license';
import { getModules } from './modules';

const getLicenseLimit = (license: ILicenseV3 | undefined, kind: LicenseLimitKind) => {
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

export function getMaxActiveUsers(this: LicenseManager) {
	return getLicenseLimit(this.getLicense(), 'activeUsers') ?? 0;
}

export function getAppsConfig(this: LicenseManager) {
	return {
		maxPrivateApps: getLicenseLimit(this.getLicense(), 'privateApps') ?? -1,
		maxMarketplaceApps: getLicenseLimit(this.getLicense(), 'marketplaceApps') ?? -1,
	};
}

export function getUnmodifiedLicenseAndModules(this: LicenseManager) {
	if (this.valid && this.unmodifiedLicense) {
		return {
			license: this.unmodifiedLicense,
			modules: getModules.call(this),
		};
	}
}
