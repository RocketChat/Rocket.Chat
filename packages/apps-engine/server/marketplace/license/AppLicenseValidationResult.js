"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLicenseValidationResult = void 0;
class AppLicenseValidationResult {
    constructor() {
        this.errors = {};
        this.warnings = {};
        this.validated = false;
    }
    addError(field, message) {
        this.errors[field] = message;
    }
    addWarning(field, message) {
        this.warnings[field] = message;
    }
    get hasErrors() {
        return !!Object.keys(this.errors).length;
    }
    get hasWarnings() {
        return !!Object.keys(this.warnings).length;
    }
    get hasBeenValidated() {
        return this.validated;
    }
    setValidated(validated) {
        this.validated = validated;
    }
    setAppId(appId) {
        this.appId = appId;
    }
    getAppId() {
        return this.appId;
    }
    getErrors() {
        return this.errors;
    }
    getWarnings() {
        return this.warnings;
    }
    toJSON() {
        return {
            errors: this.errors,
            warnings: this.warnings,
        };
    }
}
exports.AppLicenseValidationResult = AppLicenseValidationResult;
//# sourceMappingURL=AppLicenseValidationResult.js.map