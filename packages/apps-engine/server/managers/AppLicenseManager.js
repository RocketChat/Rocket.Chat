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
exports.AppLicenseManager = void 0;
const errors_1 = require("../errors");
const MarketplacePurchaseType_1 = require("../marketplace/MarketplacePurchaseType");
const license_1 = require("../marketplace/license");
var LicenseVersion;
(function (LicenseVersion) {
    LicenseVersion[LicenseVersion["v1"] = 1] = "v1";
})(LicenseVersion || (LicenseVersion = {}));
class AppLicenseManager {
    constructor(manager) {
        this.manager = manager;
        this.crypto = new license_1.Crypto(this.manager.getBridges().getInternalBridge());
        this.userBridge = this.manager.getBridges().getUserBridge();
    }
    validate(validationResult, appMarketplaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const marketplaceInfo = appMarketplaceInfo === null || appMarketplaceInfo === void 0 ? void 0 : appMarketplaceInfo[0];
            if (!marketplaceInfo || marketplaceInfo.purchaseType !== MarketplacePurchaseType_1.MarketplacePurchaseType.PurchaseTypeSubscription) {
                return;
            }
            validationResult.setValidated(true);
            const encryptedLicense = marketplaceInfo.subscriptionInfo.license.license;
            if (!encryptedLicense) {
                validationResult.addError('license', 'License for app is invalid');
                throw new errors_1.InvalidLicenseError(validationResult);
            }
            let license;
            try {
                license = (yield this.crypto.decryptLicense(encryptedLicense));
            }
            catch (err) {
                validationResult.addError('publicKey', err.message);
                throw new errors_1.InvalidLicenseError(validationResult);
            }
            switch (license.version) {
                case LicenseVersion.v1:
                    yield this.validateV1(marketplaceInfo, license, validationResult);
                    break;
            }
        });
    }
    validateV1(appMarketplaceInfo, license, validationResult) {
        return __awaiter(this, void 0, void 0, function* () {
            if (license.isBundle && (!appMarketplaceInfo.bundledIn || !appMarketplaceInfo.bundledIn.find((value) => value.bundleId === license.appId))) {
                validationResult.addError('bundle', 'License issued for a bundle that does not contain the app');
            }
            else if (!license.isBundle && license.appId !== appMarketplaceInfo.id) {
                validationResult.addError('appId', `License hasn't been issued for this app`);
            }
            const renewal = new Date(license.renewalDate);
            const expire = new Date(license.expireDate);
            const now = new Date();
            if (expire < now) {
                validationResult.addError('expire', 'License is no longer valid and needs to be renewed');
            }
            const currentActiveUsers = yield this.userBridge.getActiveUserCount();
            if (license.maxSeats < currentActiveUsers) {
                validationResult.addError('maxSeats', 'License does not accomodate the current amount of active users. Please increase the number of seats');
            }
            if (validationResult.hasErrors) {
                throw new errors_1.InvalidLicenseError(validationResult);
            }
            if (renewal < now) {
                validationResult.addWarning('renewal', 'License has expired and needs to be renewed');
            }
            if (license.seats < currentActiveUsers) {
                validationResult.addWarning('seats', 'License does not have enough seats to accommodate the current amount of active users. Please increase the number of seats');
            }
        });
    }
}
exports.AppLicenseManager = AppLicenseManager;
//# sourceMappingURL=AppLicenseManager.js.map