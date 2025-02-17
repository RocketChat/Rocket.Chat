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
exports.AppRuntimeManager = void 0;
const AppsEngineDenoRuntime_1 = require("../runtime/deno/AppsEngineDenoRuntime");
class AppRuntimeManager {
    constructor(manager) {
        this.manager = manager;
        this.subprocesses = {};
    }
    startRuntimeForApp(appPackage_1, storageItem_1) {
        return __awaiter(this, arguments, void 0, function* (appPackage, storageItem, options = { force: false }) {
            const { id: appId } = appPackage.info;
            if (appId in this.subprocesses && !options.force) {
                throw new Error('App already has an associated runtime');
            }
            this.subprocesses[appId] = new AppsEngineDenoRuntime_1.DenoRuntimeSubprocessController(this.manager, appPackage, storageItem);
            yield this.subprocesses[appId].setupApp();
            return this.subprocesses[appId];
        });
    }
    runInSandbox(appId, execRequest, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const subprocess = this.subprocesses[appId];
            if (!subprocess) {
                throw new Error('App does not have an associated runtime');
            }
            return subprocess.sendRequest(execRequest);
        });
    }
    stopRuntime(controller) {
        return __awaiter(this, void 0, void 0, function* () {
            yield controller.stopApp();
            const appId = controller.getAppId();
            if (appId in this.subprocesses) {
                delete this.subprocesses[appId];
            }
        });
    }
}
exports.AppRuntimeManager = AppRuntimeManager;
//# sourceMappingURL=AppRuntimeManager.js.map