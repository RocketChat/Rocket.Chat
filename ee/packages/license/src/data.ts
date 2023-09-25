import type { ILicenseV2 } from './definition/ILicenseV2';
import type { ILicenseV3 } from './definition/ILicenseV3';

export const licenseData: {
	license: ILicenseV3 | undefined;
	unmodifiedLicense: ILicenseV2 | ILicenseV3 | undefined;
	valid: boolean | undefined;
	inFairPolicy: boolean | undefined;
	pendingLicense: string;
	lockedLicense: string | undefined;
} = {
	license: undefined,
	unmodifiedLicense: undefined,
	valid: undefined,
	inFairPolicy: undefined,
	pendingLicense: '',
	lockedLicense: undefined,
};

export const clearLicenseData = () => {
	licenseData.license = undefined;
	licenseData.unmodifiedLicense = undefined;
	licenseData.inFairPolicy = undefined;
	licenseData.valid = false;
	licenseData.pendingLicense = '';
};
