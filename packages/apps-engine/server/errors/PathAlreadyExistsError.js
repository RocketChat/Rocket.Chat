"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathAlreadyExistsError = void 0;
class PathAlreadyExistsError {
    constructor(path) {
        this.name = 'PathAlreadyExists';
        this.message = `The api path "${path}" already exists in the system.`;
    }
}
exports.PathAlreadyExistsError = PathAlreadyExistsError;
//# sourceMappingURL=PathAlreadyExistsError.js.map