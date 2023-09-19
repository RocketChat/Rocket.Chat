import { setLicense } from './license';
import { logger } from './logger';

let pendingLicense: string;

export const setPendingLicense = (encryptedLicense: string) => {
	pendingLicense = encryptedLicense;
	if (pendingLicense) {
		logger.info('Storing license as pending validation.');
	}
};

export const applyPendingLicense = async () => {
	if (pendingLicense) {
		logger.info('Applying pending license.');
		await setLicense(pendingLicense, true);
	}
};

export const hasPendingLicense = () => Boolean(pendingLicense);

export const isPendingLicense = (encryptedLicense: string) => !!pendingLicense && pendingLicense === encryptedLicense;

export const clearPendingLicense = () => {
	if (pendingLicense) {
		logger.info('Removing pending license.');
	}

	pendingLicense = '';
};
