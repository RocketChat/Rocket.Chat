"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandAlreadyExistsError = void 0;
class CommandAlreadyExistsError {
    constructor(command) {
        this.name = 'CommandAlreadyExists';
        this.message = `The command "${command}" already exists in the system.`;
    }
}
exports.CommandAlreadyExistsError = CommandAlreadyExistsError;
//# sourceMappingURL=CommandAlreadyExistsError.js.map