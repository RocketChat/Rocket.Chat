import type { LicenseManager } from './license';
import { logger } from './logger';

export function setPendingLicense(this: LicenseManager, encryptedLicense: string) {
	this.pendingLicense = encryptedLicense;
	if (this.pendingLicense) {
		logger.info('Storing license as pending validation.');
	}
}

export async function applyPendingLicense(this: LicenseManager) {
	if (this.pendingLicense) {
		logger.info('Applying pending license.');
		return this.setLicense(this.pendingLicense);
	}
}

export function hasPendingLicense(this: LicenseManager) {
	return Boolean(this.pendingLicense);
}

export function isPendingLicense(this: LicenseManager, encryptedLicense: string) {
	return !!this.pendingLicense && this.pendingLicense === encryptedLicense;
}

export function clearPendingLicense(this: LicenseManager) {
	if (this.pendingLicense) {
		logger.info('Removing pending license.');
	}

	this.pendingLicense = '';
}
