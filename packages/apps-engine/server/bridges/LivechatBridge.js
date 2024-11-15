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
exports.LivechatBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
class LivechatBridge extends BaseBridge_1.BaseBridge {
    doIsOnline(departmentId, appId) {
        if (this.hasReadPermission(appId, 'livechat-status')) {
            return this.isOnline(departmentId, appId);
        }
    }
    doIsOnlineAsync(departmentId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-status')) {
                return this.isOnlineAsync(departmentId, appId);
            }
        });
    }
    doCreateMessage(message, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-message')) {
                return this.createMessage(message, appId);
            }
        });
    }
    doGetMessageById(messageId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-message')) {
                return this.getMessageById(messageId, appId);
            }
        });
    }
    doUpdateMessage(message, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-message')) {
                return this.updateMessage(message, appId);
            }
        });
    }
    /**
     * @deprecated please use the `doCreateAndReturnVisitor` method instead.
     */
    doCreateVisitor(visitor, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-visitor')) {
                return this.createVisitor(visitor, appId);
            }
        });
    }
    doCreateAndReturnVisitor(visitor, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-visitor')) {
                return this.createAndReturnVisitor(visitor, appId);
            }
        });
    }
    doFindVisitors(query, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-visitor')) {
                return this.findVisitors(query, appId);
            }
        });
    }
    doFindVisitorById(id, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-visitor')) {
                return this.findVisitorById(id, appId);
            }
        });
    }
    doFindVisitorByEmail(email, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-visitor')) {
                return this.findVisitorByEmail(email, appId);
            }
        });
    }
    doFindVisitorByToken(token, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-visitor')) {
                return this.findVisitorByToken(token, appId);
            }
        });
    }
    doFindVisitorByPhoneNumber(phoneNumber, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-visitor')) {
                return this.findVisitorByPhoneNumber(phoneNumber, appId);
            }
        });
    }
    doTransferVisitor(visitor, transferData, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-visitor')) {
                return this.transferVisitor(visitor, transferData, appId);
            }
        });
    }
    doCreateRoom(visitor, agent, appId, extraParams) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-room')) {
                return this.createRoom(visitor, agent, appId, extraParams);
            }
        });
    }
    doCloseRoom(room, comment, closer, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-room')) {
                return this.closeRoom(room, comment, closer, appId);
            }
        });
    }
    doCountOpenRoomsByAgentId(agentId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-room')) {
                return this.countOpenRoomsByAgentId(agentId, appId);
            }
        });
    }
    doFindOpenRoomsByAgentId(agentId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-room')) {
                return this.findOpenRoomsByAgentId(agentId, appId);
            }
        });
    }
    doFindRooms(visitor, departmentId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-room')) {
                return this.findRooms(visitor, departmentId, appId);
            }
        });
    }
    doFindDepartmentByIdOrName(value, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasReadPermission(appId, 'livechat-department') || this.hasMultiplePermission(appId, 'livechat-department')) {
                return this.findDepartmentByIdOrName(value, appId);
            }
        });
    }
    doFindDepartmentsEnabledWithAgents(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasMultiplePermission(appId, 'livechat-department')) {
                return this.findDepartmentsEnabledWithAgents(appId);
            }
        });
    }
    do_fetchLivechatRoomMessages(appId, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasMultiplePermission(appId, 'livechat-message')) {
                return this._fetchLivechatRoomMessages(appId, roomId);
            }
        });
    }
    doSetCustomFields(data, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasWritePermission(appId, 'livechat-custom-fields')) {
                return this.setCustomFields(data, appId);
            }
        });
    }
    hasReadPermission(appId, scope) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions[scope].read)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions[scope].read],
        }));
        return false;
    }
    hasWritePermission(appId, scope) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions[scope].write)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions[scope].write],
        }));
        return false;
    }
    hasMultiplePermission(appId, scope) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions[scope].multiple)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions[scope].multiple],
        }));
        return false;
    }
}
exports.LivechatBridge = LivechatBridge;
//# sourceMappingURL=LivechatBridge.js.map