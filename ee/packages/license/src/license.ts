import { clearLicenseData, licenseData } from './data';
import decrypt from './decrypt';
import type { ILicenseV2 } from './definition/ILicenseV2';
import type { ILicenseV3 } from './definition/ILicenseV3';
import { isLicenseDuplicate, lockLicense } from './encryptedLicense';
import { licenseRemoved } from './events/emitter';
import { logger } from './logger';
import { invalidateAll } from './modules';
import { clearPendingLicense, hasPendingLicense, isPendingLicense, setPendingLicense } from './pendingLicense';
import { convertToV3 } from './v2/convertToV3';
import { isReadyForValidation } from './validation/isReadyForValidation';
import { validateFormat } from './validation/validateFormat';
import { validateLicense } from './validation/validateLicense';

const setLicenseV3 = async (newLicense: ILicenseV3, encryptedLicense: string, originalLicense?: ILicenseV2 | ILicenseV3) => {
	const hadValidLicense = hasValidLicense();
	clearLicenseData();

	try {
		licenseData.unmodifiedLicense = originalLicense || newLicense;
		licenseData.license = newLicense;

		await validateLicense();
		lockLicense(encryptedLicense);
	} finally {
		if (hadValidLicense && !hasValidLicense()) {
			licenseRemoved();
			invalidateAll();
		}
	}
};

const setLicenseV2 = async (newLicense: ILicenseV2, encryptedLicense: string) =>
	setLicenseV3(convertToV3(newLicense), encryptedLicense, newLicense);

export const setLicense = async (encryptedLicense: string, forceSet = false): Promise<boolean> => {
	if (!encryptedLicense || String(encryptedLicense).trim() === '') {
		return false;
	}

	if (isLicenseDuplicate(encryptedLicense)) {
		// If there is a pending license but the user is trying to revert to the license that is currently active
		if (hasPendingLicense() && !isPendingLicense(encryptedLicense)) {
			// simply remove the pending license
			clearPendingLicense();
			return true;
		}

		return false;
	}

	if (!isReadyForValidation() && !forceSet) {
		// If we can't validate the license data yet, but is a valid license string, store it to validate when we can
		if (validateFormat(encryptedLicense)) {
			setPendingLicense(encryptedLicense);
			return true;
		}

		return false;
	}

	logger.info('New Enterprise License');
	try {
		const decrypted = decrypt(encryptedLicense);
		if (!decrypted) {
			return false;
		}

		if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
			logger.debug({ msg: 'license', decrypted });
		}

		encryptedLicense.startsWith('RCV3_')
			? await setLicenseV3(JSON.parse(decrypted), encryptedLicense)
			: await setLicenseV2(JSON.parse(decrypted), encryptedLicense);

		return true;
	} catch (e) {
		logger.error('Invalid license');
		if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
			logger.error({ msg: 'Invalid raw license', encryptedLicense, e });
		}
		return false;
	}
};

export const hasValidLicense = () => Boolean(licenseData.license && licenseData.valid);

export const getLicense = () => {
	if (licenseData.valid && licenseData.license) {
		return licenseData.license;
	}
};
