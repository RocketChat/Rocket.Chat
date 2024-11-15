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
exports.RoomBridge = exports.GetMessagesSortableFields = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
exports.GetMessagesSortableFields = ['createdAt'];
class RoomBridge extends BaseBridge_1.BaseBridge {
    doCreate(room, members, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.create(room, members, appId);
            }
        });
    }
    doGetById(roomId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getById(roomId, appId);
            }
        });
    }
    doGetByName(roomName, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getByName(roomName, appId);
            }
        });
    }
    doGetCreatorById(roomId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getCreatorById(roomId, appId);
            }
        });
    }
    doGetCreatorByName(roomName, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getCreatorByName(roomName, appId);
            }
        });
    }
    doGetDirectByUsernames(usernames, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getDirectByUsernames(usernames, appId);
            }
        });
    }
    doGetMembers(roomId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getMembers(roomId, appId);
            }
        });
    }
    doUpdate(room, members, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.update(room, members, appId);
            }
        });
    }
    doCreateDiscussion(room, parentMessage, reply, members, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.createDiscussion(room, parentMessage, reply, members, appId);
            }
        });
    }
    doDelete(room, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.delete(room, appId);
            }
        });
    }
    doGetModerators(roomId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getModerators(roomId, appId);
            }
        });
    }
    doGetOwners(roomId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getOwners(roomId, appId);
            }
        });
    }
    doGetLeaders(roomId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getLeaders(roomId, appId);
            }
        });
    }
    doGetMessages(roomId, options, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getMessages(roomId, options, appId);
            }
        });
    }
    doRemoveUsers(roomId, usernames, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId)) {
                return this.removeUsers(roomId, usernames, appId);
            }
        });
    }
    doGetUnreadByUser(roomId, uid, options, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getUnreadByUser(roomId, uid, options, appId);
            }
        });
    }
    doGetUserUnreadMessageCount(roomId, uid, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId)) {
                return this.getUserUnreadMessageCount(roomId, uid, appId);
            }
        });
    }
    hasWritePermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.room.write)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.room.write],
        }));
        return false;
    }
    hasReadPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.room.read)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.room.read],
        }));
        return false;
    }
}
exports.RoomBridge = RoomBridge;
//# sourceMappingURL=RoomBridge.js.map