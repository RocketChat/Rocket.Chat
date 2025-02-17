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
exports.PersistenceBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
class PersistenceBridge extends BaseBridge_1.BaseBridge {
    doPurge(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.purge(appId);
            }
        });
    }
    doCreate(data, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.create(data, appId);
            }
        });
    }
    doCreateWithAssociations(data, associations, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.createWithAssociations(data, associations, appId);
            }
        });
    }
    doReadById(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.readById(id, appId);
            }
        });
    }
    doReadByAssociations(associations, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.readByAssociations(associations, appId);
            }
        });
    }
    doRemove(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.remove(id, appId);
            }
        });
    }
    doRemoveByAssociations(associations, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.removeByAssociations(associations, appId);
            }
        });
    }
    doUpdate(id, data, upsert, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.update(id, data, upsert, appId);
            }
        });
    }
    doUpdateByAssociations(associations, data, upsert, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.updateByAssociations(associations, data, upsert, appId);
            }
        });
    }
    hasDefaultPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.persistence.default)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.persistence.default],
        }));
        return false;
    }
}
exports.PersistenceBridge = PersistenceBridge;
//# sourceMappingURL=PersistenceBridge.js.map