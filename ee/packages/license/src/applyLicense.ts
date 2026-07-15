import { getLicenseCreatedAt } from './getLicenseCreatedAt';
import type { LicenseImp } from './licenseImp';
import { License } from './licenseImp';

export const applyLicense = async (license: string, isNewLicense: boolean, manager: LicenseImp = License): Promise<boolean> => {
	const enterpriseLicense = (license ?? '').trim();
	if (!enterpriseLicense) {
		return false;
	}

	if (enterpriseLicense === manager.encryptedLicense) {
		return false;
	}

	try {
		return manager.setLicense(enterpriseLicense, isNewLicense);
	} catch {
		return false;
	}
};

export const applyLicenseOrRemove = async (license: string, isNewLicense: boolean, manager: LicenseImp = License): Promise<boolean> => {
	const enterpriseLicense = (license ?? '').trim();
	if (!enterpriseLicense) {
		manager.remove();
		return false;
	}

	if (enterpriseLicense === manager.encryptedLicense) {
		return false;
	}

	try {
		return manager.setLicense(enterpriseLicense, isNewLicense);
	} catch {
		manager.remove();
		return false;
	}
};

/**
 * Applies whichever of the two licenses was issued most recently, falling back to
 * the other one when the newest doesn't result in a valid license (note that
 * `setLicense` reports success even for licenses applied in an invalid/expired
 * state, so validity — not the apply result — drives the fallback).
 *
 * `storedLicense` is the license already known to the workspace (applied as not
 * new); `providedLicense` is externally supplied, e.g. through an environment
 * variable (applied as new). Issue dates come from signature-verified payloads
 * only — licenses without one (V2, invalid or empty strings) sort as oldest, so
 * two undated licenses keep the traditional stored-first order.
 *
 * Returns whether the workspace ended up with a valid license.
 */
export const applyNewestLicense = async (
	storedLicense: string,
	providedLicense: string,
	manager: LicenseImp = License,
): Promise<boolean> => {
	const [storedCreatedAt, providedCreatedAt] = await Promise.all([
		getLicenseCreatedAt(storedLicense),
		getLicenseCreatedAt(providedLicense),
	]);

	const providedIsNewer = !!providedCreatedAt && (!storedCreatedAt || providedCreatedAt > storedCreatedAt);

	const [first, second] = providedIsNewer
		? [() => applyLicense(providedLicense, true, manager), () => applyLicense(storedLicense, false, manager)]
		: [() => applyLicense(storedLicense, false, manager), () => applyLicense(providedLicense, true, manager)];

	await first();

	if (manager.hasValidLicense()) {
		return true;
	}

	await second();

	return manager.hasValidLicense();
};
