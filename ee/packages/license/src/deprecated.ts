import type { ILicenseV3, LicenseLimitKind } from '@rocket.chat/core-typings';

import type { LicenseManager } from './license';
import { getModules } from './modules';
import { defaultLimits } from './validation/validateDefaultLimits';

export const getLicenseLimit = (license: ILicenseV3 | undefined, kind: LicenseLimitKind) => {
	const limitList = license ? license.limits[kind] : defaultLimits[kind as keyof typeof defaultLimits];

	if (!limitList?.length) {
		return -1;
	}

	return Math.min(...limitList.map(({ max }) => max));
};

// #TODO: Remove references to those functions

export function getMaxActiveUsers(this: LicenseManager) {
	return getLicenseLimit(this.getLicense(), 'activeUsers') ?? 0;
}

export function getAppsConfig(this: LicenseManager) {
	return {
		maxPrivateApps: getLicenseLimit(this.getLicense(), 'privateApps'),
		maxMarketplaceApps: getLicenseLimit(this.getLicense(), 'marketplaceApps'),
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
