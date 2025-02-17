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
exports.UserBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
class UserBridge extends BaseBridge_1.BaseBridge {
    doGetById(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getById(id, appId);
            }
        });
    }
    doGetByUsername(username, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getByUsername(username, appId);
            }
        });
    }
    doGetAppUser(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getAppUser(appId);
        });
    }
    doCreate(data, appId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.create(data, appId, options || {});
            }
        });
    }
    doRemove(user, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.remove(user, appId);
            }
        });
    }
    doUpdate(user, updates, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.update(user, updates, appId);
            }
        });
    }
    doGetUserUnreadMessageCount(uid, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getUserUnreadMessageCount(uid, appId);
            }
        });
    }
    doDeleteUsersCreatedByApp(appId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.deleteUsersCreatedByApp(appId, type);
            }
        });
    }
    doDeactivate(userId, confirmRelinquish, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.deactivate(userId, confirmRelinquish, appId);
            }
        });
    }
    hasReadPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.user.read)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.user.read],
        }));
        return false;
    }
    hasWritePermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.user.write)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.user.write],
        }));
        return false;
    }
}
exports.UserBridge = UserBridge;
//# sourceMappingURL=UserBridge.js.map