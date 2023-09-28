import { InvalidLicenseError } from '../errors/InvalidLicenseError';
import { decrypt } from '../token';

export const validateFormat = async (encryptedLicense: string): Promise<boolean> => {
	if (!encryptedLicense || String(encryptedLicense).trim() === '') {
		throw new InvalidLicenseError('Empty license');
	}

	try {
		await decrypt(encryptedLicense);
	} catch (e) {
		throw new InvalidLicenseError();
	}

	return true;
};
