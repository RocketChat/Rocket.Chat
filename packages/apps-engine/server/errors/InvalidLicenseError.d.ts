import type { AppLicenseValidationResult } from '../marketplace/license/AppLicenseValidationResult';
export declare class InvalidLicenseError extends Error {
    readonly validationResult: AppLicenseValidationResult;
    constructor(validationResult: AppLicenseValidationResult);
}
