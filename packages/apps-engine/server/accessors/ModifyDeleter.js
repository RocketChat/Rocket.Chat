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
exports.ModifyDeleter = void 0;
class ModifyDeleter {
    constructor(bridges, appId) {
        this.bridges = bridges;
        this.appId = appId;
    }
    deleteRoom(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridges.getRoomBridge().doDelete(roomId, this.appId);
        });
    }
    deleteUsers(appId, userType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridges.getUserBridge().doDeleteUsersCreatedByApp(appId, userType);
        });
    }
    deleteMessage(message, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridges.getMessageBridge().doDelete(message, user, this.appId);
        });
    }
    /**
     * Removes `usernames` from the room's member list
     *
     * For performance reasons, it is only possible to remove 50 users in one
     * call to this method. Removing users is an expensive operation due to the
     * amount of entity relationships that need to be modified.
     */
    removeUsersFromRoom(roomId, usernames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (usernames.length > 50) {
                throw new Error('A maximum of 50 members can be removed in a single call');
            }
            return this.bridges.getRoomBridge().doRemoveUsers(roomId, usernames, this.appId);
        });
    }
}
exports.ModifyDeleter = ModifyDeleter;
//# sourceMappingURL=ModifyDeleter.js.map