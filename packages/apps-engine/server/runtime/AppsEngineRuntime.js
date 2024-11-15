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
exports.AppsEngineRuntime = exports.APPS_ENGINE_RUNTIME_FILE_PREFIX = exports.APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT = void 0;
exports.getFilenameForApp = getFilenameForApp;
exports.APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT = 1000;
exports.APPS_ENGINE_RUNTIME_FILE_PREFIX = '$RocketChat_App$';
function getFilenameForApp(filename) {
    return `${exports.APPS_ENGINE_RUNTIME_FILE_PREFIX}_${filename}`;
}
class AppsEngineRuntime {
    static runCode(code, sandbox, options) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Can't call this method on abstract class. Override it in a proper runtime class.`);
        });
    }
    static runCodeSync(code, sandbox, options) {
        throw new Error(`Can't call this method on abstract class. Override it in a proper runtime class.`);
    }
    constructor(app, customRequire) { }
}
exports.AppsEngineRuntime = AppsEngineRuntime;
//# sourceMappingURL=AppsEngineRuntime.js.map