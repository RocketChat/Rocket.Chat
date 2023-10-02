import type { ILicenseV3 } from '@rocket.chat/license';

export const hasLicenseModule = (license: ILicenseV3, moduleName: string): boolean => {
	return license?.grantedModules.some((obj) => obj.module === moduleName);
};
