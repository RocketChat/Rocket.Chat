"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsEngineEmptyRuntime = void 0;
const AppsEngineRuntime_1 = require("./AppsEngineRuntime");
class AppsEngineEmptyRuntime extends AppsEngineRuntime_1.AppsEngineRuntime {
    static runCode(code, sandbox, options) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Empty runtime does not support code execution');
        });
    }
    static runCodeSync(code, sandbox, options) {
        throw new Error('Empty runtime does not support code execution');
    }
    constructor(app) {
        super(app, () => { });
        this.app = app;
    }
    runInSandbox(code, sandbox, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.reject(new Error('Empty runtime does not support execution'));
        });
    }
}
exports.AppsEngineEmptyRuntime = AppsEngineEmptyRuntime;
//# sourceMappingURL=AppsEngineEmptyRuntime.js.map