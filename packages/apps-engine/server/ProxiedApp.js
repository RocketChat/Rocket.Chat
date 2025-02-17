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
exports.ProxiedApp = void 0;
const AppStatus_1 = require("../definition/AppStatus");
const exceptions_1 = require("../definition/exceptions");
const metadata_1 = require("../definition/metadata");
const InvalidInstallationError_1 = require("./errors/InvalidInstallationError");
const logging_1 = require("./logging");
const license_1 = require("./marketplace/license");
const AppsEngineDenoRuntime_1 = require("./runtime/deno/AppsEngineDenoRuntime");
class ProxiedApp {
    constructor(manager, storageItem, appRuntime) {
        this.manager = manager;
        this.storageItem = storageItem;
        this.appRuntime = appRuntime;
        this.previousStatus = storageItem.status;
    }
    getRuntime() {
        return this.manager.getRuntime();
    }
    getDenoRuntime() {
        return this.appRuntime;
    }
    getStorageItem() {
        return this.storageItem;
    }
    setStorageItem(item) {
        this.storageItem = item;
    }
    getPreviousStatus() {
        return this.previousStatus;
    }
    getImplementationList() {
        return this.storageItem.implemented;
    }
    setupLogger(method) {
        const logger = new logging_1.AppConsole(method);
        return logger;
    }
    // We'll need to refactor this method to remove the rest parameters so we can pass an options parameter
    call(method, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            let options;
            try {
                return yield this.appRuntime.sendRequest({ method: `app:${method}`, params: args }, options);
            }
            catch (e) {
                if (e.code === exceptions_1.AppsEngineException.JSONRPC_ERROR_CODE) {
                    throw new exceptions_1.AppsEngineException(e.message);
                }
                if (e.code === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                    throw e;
                }
                // We cannot throw this error as the previous implementation swallowed those
                // and since the server is not prepared to handle those we might crash it if we throw
                // Range of JSON-RPC error codes: https://www.jsonrpc.org/specification#error_object
                if (e.code >= -32999 || e.code <= -32000) {
                    // we really need to receive a logger from rocket.chat
                    console.error('JSON-RPC error received: ', e);
                }
            }
        });
    }
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appRuntime.getStatus().catch(() => AppStatus_1.AppStatus.UNKNOWN);
        });
    }
    setStatus(status, silent) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call(metadata_1.AppMethod.SETSTATUS, status);
            if (!silent) {
                yield this.manager.getBridges().getAppActivationBridge().doAppStatusChanged(this, status);
            }
        });
    }
    getName() {
        return this.storageItem.info.name;
    }
    getNameSlug() {
        return this.storageItem.info.nameSlug;
    }
    // @deprecated This method will be removed in the next major version
    getAppUserUsername() {
        return `${this.storageItem.info.nameSlug}.bot`;
    }
    getID() {
        return this.storageItem.id;
    }
    getInstallationSource() {
        return this.storageItem.installationSource;
    }
    getVersion() {
        return this.storageItem.info.version;
    }
    getDescription() {
        return this.storageItem.info.description;
    }
    getRequiredApiVersion() {
        return this.storageItem.info.requiredApiVersion;
    }
    getAuthorInfo() {
        return this.storageItem.info.author;
    }
    getInfo() {
        return this.storageItem.info;
    }
    getEssentials() {
        return this.getInfo().essentials;
    }
    getLatestLicenseValidationResult() {
        return this.latestLicenseValidationResult;
    }
    validateInstallation() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.manager.getSignatureManager().verifySignedApp(this.getStorageItem());
            }
            catch (e) {
                throw new InvalidInstallationError_1.InvalidInstallationError(e.message);
            }
        });
    }
    validateLicense() {
        const { marketplaceInfo } = this.getStorageItem();
        this.latestLicenseValidationResult = new license_1.AppLicenseValidationResult();
        return this.manager.getLicenseManager().validate(this.latestLicenseValidationResult, marketplaceInfo);
    }
}
exports.ProxiedApp = ProxiedApp;
//# sourceMappingURL=ProxiedApp.js.map