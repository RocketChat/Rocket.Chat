import { licenseData } from './data';
import { setLicense } from './license';
import { logger } from './logger';

export const setPendingLicense = (encryptedLicense: string) => {
	licenseData.pendingLicense = encryptedLicense;
	if (licenseData.pendingLicense) {
		logger.info('Storing license as pending validation.');
	}
};

export const applyPendingLicense = async () => {
	if (licenseData.pendingLicense) {
		logger.info('Applying pending license.');
		await setLicense(licenseData.pendingLicense);
	}
};

export const hasPendingLicense = () => Boolean(licenseData.pendingLicense);

export const isPendingLicense = (encryptedLicense: string) => hasPendingLicense() && licenseData.pendingLicense === encryptedLicense;

export const clearPendingLicense = () => {
	if (licenseData.pendingLicense) {
		logger.info('Removing pending license.');
	}

	licenseData.pendingLicense = '';
};
