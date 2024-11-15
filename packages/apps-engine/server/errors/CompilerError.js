"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilerError = void 0;
class CompilerError {
    constructor(detail) {
        this.name = 'CompilerError';
        this.message = `An error occured while compiling an App: ${detail}`;
    }
}
exports.CompilerError = CompilerError;
//# sourceMappingURL=CompilerError.js.map