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
exports.AppsEngineNodeRuntime = void 0;
const timers = require("timers");
const vm = require("vm");
const AppsEngineRuntime_1 = require("./AppsEngineRuntime");
class AppsEngineNodeRuntime extends AppsEngineRuntime_1.AppsEngineRuntime {
    static runCode(code, sandbox, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                process.nextTick(() => {
                    try {
                        resolve(this.runCodeSync(code, sandbox, options));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
        });
    }
    static runCodeSync(code, sandbox, options) {
        return vm.runInNewContext(code, Object.assign(Object.assign({}, AppsEngineNodeRuntime.defaultContext), sandbox), Object.assign(Object.assign({}, AppsEngineNodeRuntime.defaultRuntimeOptions), (options || {})));
    }
    constructor(app, customRequire) {
        super(app, customRequire);
        this.app = app;
        this.customRequire = customRequire;
    }
    runInSandbox(code, sandbox, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                process.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        sandbox !== null && sandbox !== void 0 ? sandbox : (sandbox = {});
                        const result = yield vm.runInNewContext(code, Object.assign(Object.assign(Object.assign({}, AppsEngineNodeRuntime.defaultContext), sandbox), { require: this.customRequire }), Object.assign(Object.assign({}, AppsEngineNodeRuntime.defaultRuntimeOptions), { filename: (0, AppsEngineRuntime_1.getFilenameForApp)((options === null || options === void 0 ? void 0 : options.filename) || this.app.getName()) }));
                        resolve(result);
                    }
                    catch (e) {
                        reject(e);
                    }
                }));
            });
        });
    }
}
exports.AppsEngineNodeRuntime = AppsEngineNodeRuntime;
AppsEngineNodeRuntime.defaultRuntimeOptions = {
    timeout: AppsEngineRuntime_1.APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT,
};
AppsEngineNodeRuntime.defaultContext = Object.assign(Object.assign({}, timers), { Buffer,
    console, process: {}, exports: {} });
//# sourceMappingURL=AppsEngineNodeRuntime.js.map