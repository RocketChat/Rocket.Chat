import { License } from './licenseImp';

export const applyLicense = async (license: string, isNewLicense: boolean): Promise<boolean> => {
	const enterpriseLicense = (license ?? '').trim();
	if (!enterpriseLicense) {
		return false;
	}

	if (enterpriseLicense === License.encryptedLicense) {
		return false;
	}

	try {
		return License.setLicense(enterpriseLicense, isNewLicense);
	} catch {
		return false;
	}
};

export const applyLicenseOrRemove = async (license: string, isNewLicense: boolean): Promise<boolean> => {
	const enterpriseLicense = (license ?? '').trim();
	if (!enterpriseLicense) {
		License.remove();
		return false;
	}

	if (enterpriseLicense === License.encryptedLicense) {
		return false;
	}

	try {
		return License.setLicense(enterpriseLicense, isNewLicense);
	} catch {
		License.remove();
		return false;
	}
};
