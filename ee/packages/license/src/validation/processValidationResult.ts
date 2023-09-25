import { licenseData } from '../data';
import type { BehaviorWithContext } from '../definition/LicenseBehavior';
import { licenseValidated } from '../events/emitter';
import { logger } from '../logger';
import { replaceModules } from '../modules';
import { showLicense } from '../showLicense';
import { replaceTags } from '../tags';
import { getModulesToDisable } from './getModulesToDisable';
import { isBehaviorsInResult } from './isBehaviorsInResult';

export const processValidationResult = (result: BehaviorWithContext[]) => {
	if (!licenseData.license || isBehaviorsInResult(result, ['invalidate_license', 'prevent_installation'])) {
		return;
	}

	licenseData.valid = true;
	licenseData.inFairPolicy = isBehaviorsInResult(result, ['start_fair_policy']);

	if (licenseData.license.information.tags) {
		replaceTags(licenseData.license.information.tags);
	}

	const disabledModules = getModulesToDisable(result);
	const modulesToEnable = licenseData.license.grantedModules.filter(({ module }) => !disabledModules.includes(module));

	replaceModules(modulesToEnable.map(({ module }) => module));
	logger.log({ msg: 'License validated', modules: modulesToEnable });

	licenseValidated();
	showLicense(licenseData.license, licenseData.valid);
};
