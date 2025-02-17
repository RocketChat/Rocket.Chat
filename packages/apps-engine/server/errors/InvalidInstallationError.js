"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidInstallationError = void 0;
class InvalidInstallationError extends Error {
    constructor(message) {
        super(`Invalid app installation: ${message}`);
    }
}
exports.InvalidInstallationError = InvalidInstallationError;
//# sourceMappingURL=InvalidInstallationError.js.map