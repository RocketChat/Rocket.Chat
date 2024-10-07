import type { AppLicenseValidationResult } from '../marketplace/license/AppLicenseValidationResult';

export class InvalidLicenseError extends Error {
    public constructor(public readonly validationResult: AppLicenseValidationResult) {
        super('Invalid app license');
    }
}
