"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRequiredTwoFactorMethod = exports.isTwoFactorMethod = exports.isTotpInvalidError = exports.isTotpRequiredError = void 0;
const twoFactorMethods = ['totp', 'email', 'password'];
const isTotpRequiredError = (error) => typeof error === 'object' &&
    ((error === null || error === void 0 ? void 0 : error.error) === 'totp-required' ||
        (error === null || error === void 0 ? void 0 : error.errorType) === 'totp-required');
exports.isTotpRequiredError = isTotpRequiredError;
const isTotpInvalidError = (error) => (error === null || error === void 0 ? void 0 : error.error) === 'totp-invalid' ||
    (error === null || error === void 0 ? void 0 : error.errorType) === 'totp-invalid';
exports.isTotpInvalidError = isTotpInvalidError;
const isTwoFactorMethod = (method) => twoFactorMethods.includes(method);
exports.isTwoFactorMethod = isTwoFactorMethod;
const hasRequiredTwoFactorMethod = (error) => {
    const details = error && typeof error === 'object' && 'details' in error && error.details;
    return (typeof details === 'object' &&
        details !== null &&
        typeof details.method === 'string' &&
        (0, exports.isTwoFactorMethod)(details.method));
};
exports.hasRequiredTwoFactorMethod = hasRequiredTwoFactorMethod;
//# sourceMappingURL=errors.js.map