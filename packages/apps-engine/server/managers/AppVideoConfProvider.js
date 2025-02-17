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
exports.AppVideoConfProvider = void 0;
const metadata_1 = require("../../definition/metadata");
const AppsEngineDenoRuntime_1 = require("../runtime/deno/AppsEngineDenoRuntime");
class AppVideoConfProvider {
    constructor(app, provider) {
        this.app = app;
        this.provider = provider;
        this.isRegistered = false;
    }
    hasBeenRegistered() {
        this.isRegistered = true;
    }
    runIsFullyConfigured(logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            return !!(yield this.runTheCode(metadata_1.AppMethod._VIDEOCONF_IS_CONFIGURED, logStorage, accessors, []));
        });
    }
    runGenerateUrl(call, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.runTheCode(metadata_1.AppMethod._VIDEOCONF_GENERATE_URL, logStorage, accessors, [call]));
        });
    }
    runCustomizeUrl(call_1, user_1) {
        return __awaiter(this, arguments, void 0, function* (call, user, options = {}, logStorage, accessors) {
            return (yield this.runTheCode(metadata_1.AppMethod._VIDEOCONF_CUSTOMIZE_URL, logStorage, accessors, [call, user, options]));
        });
    }
    runOnNewVideoConference(call, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runTheCode(metadata_1.AppMethod._VIDEOCONF_NEW, logStorage, accessors, [call]);
        });
    }
    runOnVideoConferenceChanged(call, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runTheCode(metadata_1.AppMethod._VIDEOCONF_CHANGED, logStorage, accessors, [call]);
        });
    }
    runOnUserJoin(call, user, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runTheCode(metadata_1.AppMethod._VIDEOCONF_USER_JOINED, logStorage, accessors, [call, user]);
        });
    }
    runGetVideoConferenceInfo(call, user, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.runTheCode(metadata_1.AppMethod._VIDEOCONF_GET_INFO, logStorage, accessors, [call, user]));
        });
    }
    runTheCode(method, _logStorage, _accessors, runContextArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = this.provider.name;
            try {
                const result = yield this.app.getDenoRuntime().sendRequest({
                    method: `videoconference:${provider}:${method}`,
                    params: runContextArgs,
                });
                return result;
            }
            catch (e) {
                if ((e === null || e === void 0 ? void 0 : e.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                    if (method === metadata_1.AppMethod._VIDEOCONF_IS_CONFIGURED) {
                        return true;
                    }
                    if (![metadata_1.AppMethod._VIDEOCONF_GENERATE_URL, metadata_1.AppMethod._VIDEOCONF_CUSTOMIZE_URL].includes(method)) {
                        return undefined;
                    }
                }
                // @TODO add error handling
                console.log(e);
            }
        });
    }
}
exports.AppVideoConfProvider = AppVideoConfProvider;
//# sourceMappingURL=AppVideoConfProvider.js.map