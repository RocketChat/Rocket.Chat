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
exports.OAuthAppsBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
class OAuthAppsBridge extends BaseBridge_1.BaseBridge {
    doCreate(oAuthApp, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.create(oAuthApp, appId);
            }
        });
    }
    doGetByid(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getById(id, appId);
            }
        });
    }
    doGetByName(name, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getByName(name, appId);
            }
        });
    }
    doUpdate(oAuthApp, id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.update(oAuthApp, id, appId);
            }
        });
    }
    doDelete(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.delete(id, appId);
            }
        });
    }
    doPurge(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.purge(appId);
            }
        });
    }
    hasWritePermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions['oauth-app'].write)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions['oauth-app'].write],
        }));
        return false;
    }
    hasReadPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions['oauth-app'].read)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions['oauth-app'].read],
        }));
        return false;
    }
}
exports.OAuthAppsBridge = OAuthAppsBridge;
//# sourceMappingURL=OAuthAppsBridge.js.map