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
exports.ServerSettingBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
class ServerSettingBridge extends BaseBridge_1.BaseBridge {
    doGetAll(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getAll(appId);
            }
        });
    }
    doGetOneById(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getOneById(id, appId);
            }
        });
    }
    doHideGroup(name, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.hideGroup(name, appId);
            }
        });
    }
    doHideSetting(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.hideSetting(id, appId);
            }
        });
    }
    doIsReadableById(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.isReadableById(id, appId);
            }
        });
    }
    doUpdateOne(setting, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.updateOne(setting, appId);
            }
        });
    }
    doIncrementValue(id, value, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.incrementValue(id, value, appId);
            }
        });
    }
    hasWritePermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.setting.write)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.setting.write],
        }));
        return false;
    }
    hasReadPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.setting.read)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.setting.read],
        }));
        return false;
    }
}
exports.ServerSettingBridge = ServerSettingBridge;
//# sourceMappingURL=ServerSettingBridge.js.map