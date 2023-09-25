import { licenseData } from './data';

export const lockLicense = (encryptedLicense: string) => {
	licenseData.lockedLicense = encryptedLicense;
};

export const isLicenseDuplicate = (encryptedLicense: string) =>
	Boolean(licenseData.lockedLicense && licenseData.lockedLicense === encryptedLicense);
