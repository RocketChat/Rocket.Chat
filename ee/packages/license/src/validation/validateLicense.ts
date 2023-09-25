import { licenseData } from '../data';
import { isReadyForValidation } from './isReadyForValidation';
import { processValidationResult } from './processValidationResult';
import { runValidation } from './runValidation';

export const validateLicense = async () => {
	if (!licenseData.license || !isReadyForValidation()) {
		return;
	}

	// #TODO: Only include 'prevent_installation' here if this is actually the initial installation of the license
	const validationResult = await runValidation(licenseData.license, [
		'invalidate_license',
		'prevent_installation',
		'start_fair_policy',
		'disable_modules',
	]);
	processValidationResult(validationResult);
};
