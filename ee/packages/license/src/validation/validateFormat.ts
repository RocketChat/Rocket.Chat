import decrypt from '../decrypt';
import { InvalidLicenseError } from '../errors/InvalidLicenseError';

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
