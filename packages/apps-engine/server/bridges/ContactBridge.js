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
exports.ContactBridge = void 0;
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
const BaseBridge_1 = require("./BaseBridge");
class ContactBridge extends BaseBridge_1.BaseBridge {
    doGetById(contactId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getById(contactId, appId);
            }
        });
    }
    doVerifyContact(verifyContactChannelParams, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.verifyContact(verifyContactChannelParams, appId);
            }
        });
    }
    doAddContactEmail(contactId, email, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.addContactEmail(contactId, email, appId);
            }
        });
    }
    hasReadPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.contact.read)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.contact.read],
        }));
        return false;
    }
    hasWritePermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.contact.write)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.contact.write],
        }));
        return false;
    }
}
exports.ContactBridge = ContactBridge;
//# sourceMappingURL=ContactBridge.js.map