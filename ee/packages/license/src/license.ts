import decrypt from './decrypt';
import type { ILicenseV2 } from './definition/ILicenseV2';
import type { ILicenseV3 } from './definition/ILicenseV3';
import type { BehaviorWithContext } from './definition/LicenseBehavior';
import { isLicenseDuplicate, lockLicense } from './encryptedLicense';
import { licenseRemoved, licenseValidated } from './events/emitter';
import { logger } from './logger';
import { getModules, invalidateAll, notifyValidatedModules } from './modules';
import { showLicense } from './showLicense';
import { addTags } from './tags';
import { convertToV3 } from './v2/convertToV3';
import { getModulesToDisable } from './validation/getModulesToDisable';
import { isBehaviorsInResult } from './validation/isBehaviorsInResult';
import { runValidation } from './validation/runValidation';

let unmodifiedLicense: ILicenseV2 | ILicenseV3 | undefined;
let license: ILicenseV3 | undefined;
let valid: boolean | undefined;
let inFairPolicy: boolean | undefined;

const removeCurrentLicense = () => {
	const oldLicense = license;
	const wasValid = valid;

	license = undefined;
	unmodifiedLicense = undefined;
	valid = undefined;
	inFairPolicy = undefined;

	if (!oldLicense || !wasValid) {
		return;
	}

	valid = false;

	licenseRemoved();
	invalidateAll();
};

const processValidationResult = (result: BehaviorWithContext[]) => {
	if (!license || isBehaviorsInResult(result, ['invalidate_license', 'prevent_installation'])) {
		return;
	}

	valid = true;
	inFairPolicy = isBehaviorsInResult(result, ['start_fair_policy']);

	if (license.information.tags) {
		addTags(license.information.tags);
	}

	const disabledModules = getModulesToDisable(result);
	const modulesToEnable = license.grantedModules.filter(({ module }) => !disabledModules.includes(module));

	notifyValidatedModules(modulesToEnable.map(({ module }) => module));
	logger.log({ msg: 'License validated', modules: modulesToEnable });

	licenseValidated();
	showLicense(license, valid);
};

export const validateLicense = async () => {
	if (!license) {
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

const setLicenseV3 = async (newLicense: ILicenseV3, originalLicense?: ILicenseV2 | ILicenseV3) => {
	removeCurrentLicense();
	unmodifiedLicense = originalLicense || newLicense;
	license = newLicense;

	await validateLicense();
};

const setLicenseV2 = async (newLicense: ILicenseV2) => setLicenseV3(convertToV3(newLicense), newLicense);

export const setLicense = async (encryptedLicense: string): Promise<boolean> => {
	if (!encryptedLicense || String(encryptedLicense).trim() === '' || isLicenseDuplicate(encryptedLicense)) {
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

		// #TODO: Check license version and call setLicenseV2 or setLicenseV3
		await setLicenseV2(JSON.parse(decrypted));
		lockLicense(encryptedLicense);

		return true;
	} catch (e) {
		logger.error('Invalid license');
		if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
			logger.error({ msg: 'Invalid raw license', encryptedLicense, e });
		}
		return false;
	}
};

export const isEnterprise = () => Boolean(license && valid);

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
