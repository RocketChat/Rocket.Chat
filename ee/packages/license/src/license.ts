import decrypt from './decrypt';
import type { ILicenseV2 } from './definition/ILicenseV2';
import type { ILicenseV3 } from './definition/ILicenseV3';
import type { BehaviorWithContext } from './definition/LicenseBehavior';
import { isLicenseDuplicate, lockLicense } from './encryptedLicense';
import { licenseRemoved, licenseValidated } from './events/emitter';
import { logger } from './logger';
import { getModules, invalidateAll, replaceModules } from './modules';
import { clearPendingLicense, hasPendingLicense, isPendingLicense, setPendingLicense } from './pendingLicense';
import { showLicense } from './showLicense';
import { replaceTags } from './tags';
import { convertToV3 } from './v2/convertToV3';
import { getModulesToDisable } from './validation/getModulesToDisable';
import { isBehaviorsInResult } from './validation/isBehaviorsInResult';
import { runValidation } from './validation/runValidation';
import { validateFormat } from './validation/validateFormat';
import { getWorkspaceUrl } from './workspaceUrl';

let unmodifiedLicense: ILicenseV2 | ILicenseV3 | undefined;
let license: ILicenseV3 | undefined;
let valid: boolean | undefined;
let inFairPolicy: boolean | undefined;

const clearLicenseData = () => {
	license = undefined;
	unmodifiedLicense = undefined;
	valid = undefined;
	inFairPolicy = undefined;
	valid = false;
};

const processValidationResult = (result: BehaviorWithContext[]) => {
	if (!license || isBehaviorsInResult(result, ['invalidate_license', 'prevent_installation'])) {
		return;
	}

	valid = true;
	inFairPolicy = isBehaviorsInResult(result, ['start_fair_policy']);

	if (license.information.tags) {
		replaceTags(license.information.tags);
	}

	const disabledModules = getModulesToDisable(result);
	const modulesToEnable = license.grantedModules.filter(({ module }) => !disabledModules.includes(module));

	replaceModules(modulesToEnable.map(({ module }) => module));
	logger.log({ msg: 'License validated', modules: modulesToEnable });

	licenseValidated();
	showLicense(license, valid);
};

export const validateLicense = async () => {
	if (!license || !getWorkspaceUrl()) {
		return;
	}

	// #TODO: Only include 'prevent_installation' here if this is actually the initial installation of the license
	const validationResult = await runValidation(license, [
		'invalidate_license',
		'prevent_installation',
		'start_fair_policy',
		'disable_modules',
	]);
	processValidationResult(validationResult);
};

const setLicenseV3 = async (newLicense: ILicenseV3, encryptedLicense: string, originalLicense?: ILicenseV2 | ILicenseV3) => {
	const hadValidLicense = hasValidLicense();
	clearLicenseData();

	try {
		unmodifiedLicense = originalLicense || newLicense;
		license = newLicense;
		clearPendingLicense();

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

// Can only validate licenses once the workspace URL is set
export const isReadyForValidation = () => Boolean(getWorkspaceUrl());

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

export const hasValidLicense = () => Boolean(license && valid);

export const getUnmodifiedLicenseAndModules = () => {
	if (valid && unmodifiedLicense) {
		return {
			license: unmodifiedLicense,
			modules: getModules(),
		};
	}
};

export const getLicense = () => {
	if (valid && license) {
		return license;
	}
};

export const startedFairPolicy = () => Boolean(inFairPolicy);
