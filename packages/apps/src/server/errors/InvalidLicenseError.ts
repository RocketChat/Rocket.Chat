import type { AppLicenseValidationResult } from '../marketplace/license/AppLicenseValidationResult.js';

export class InvalidLicenseError extends Error {
	public constructor(public readonly validationResult: AppLicenseValidationResult) {
		super('Invalid app license');
	}
}
