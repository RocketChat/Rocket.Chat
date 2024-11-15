"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppFabricationFulfillment = void 0;
const license_1 = require("../marketplace/license");
class AppFabricationFulfillment {
    constructor() {
        this.licenseValidationResult = new license_1.AppLicenseValidationResult();
    }
    setAppInfo(information) {
        this.info = information;
        this.licenseValidationResult.setAppId(information.id);
    }
    getAppInfo() {
        return this.info;
    }
    setApp(application) {
        this.app = application;
    }
    getApp() {
        return this.app;
    }
    setImplementedInterfaces(interfaces) {
        this.implemented = interfaces;
    }
    getImplementedInferfaces() {
        return this.implemented;
    }
    setStorageError(errorMessage) {
        this.storageError = errorMessage;
    }
    setAppUserError(error) {
        this.appUserError = error;
    }
    getStorageError() {
        return this.storageError;
    }
    getAppUserError() {
        return this.appUserError;
    }
    hasStorageError() {
        return !!this.storageError;
    }
    hasAppUserError() {
        return !!this.appUserError;
    }
    getLicenseValidationResult() {
        return this.licenseValidationResult;
    }
}
exports.AppFabricationFulfillment = AppFabricationFulfillment;
//# sourceMappingURL=AppFabricationFulfillment.js.map