"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidLicenseError = void 0;
class InvalidLicenseError extends Error {
    constructor(validationResult) {
        super('Invalid app license');
        this.validationResult = validationResult;
    }
}
exports.InvalidLicenseError = InvalidLicenseError;
//# sourceMappingURL=InvalidLicenseError.js.map