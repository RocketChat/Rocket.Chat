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
 * Applies the most recently issued of the given licenses, falling back to the
 * next one whenever the newest doesn't result in a valid license (note that
 * `setLicense` reports success even for licenses applied in an invalid/expired
 * state, so validity — not the apply result — drives the fallback).
 *
 * The first license is the one already known to the workspace (applied as not
 * new); the others are externally supplied, e.g. through an environment
 * variable (applied as new). Issue dates come from signature-verified payloads
 * only — licenses without one (V2, invalid or empty strings) sort as oldest,
 * preserving the given order among themselves.
 *
 * Returns whether the workspace ended up with a valid license.
 */
export const applyNewestLicense = async (manager: LicenseImp = License, ...licenses: Array<string>): Promise<boolean> => {
	const candidates = licenses
		.map((license, index) => ({ license: (license ?? '').trim(), isNewLicense: index > 0 }))
		.filter(({ license }) => license);

	const sortedLicenses = (
		await Promise.all(candidates.map(async (candidate) => ({ ...candidate, createdAt: await getLicenseCreatedAt(candidate.license) })))
	).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

	for (const { license, isNewLicense } of sortedLicenses) {
		await applyLicense(license, isNewLicense, manager);

		if (manager.hasValidLicense()) {
			return true;
		}
	}

	return manager.hasValidLicense();
};
