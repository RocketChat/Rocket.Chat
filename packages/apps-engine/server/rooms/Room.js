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
exports.Room = void 0;
const PrivateManager = Symbol('RoomPrivateManager');
class Room {
    /**
     * @deprecated
     */
    get usernames() {
        // Get usernames
        if (!this._USERNAMES) {
            this._USERNAMES = this[PrivateManager].getBridges().getInternalBridge().doGetUsernamesOfRoomByIdSync(this.id);
        }
        return this._USERNAMES;
    }
    set usernames(usernames) { }
    constructor(room, manager) {
        Object.assign(this, room);
        Object.defineProperty(this, PrivateManager, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: manager,
        });
    }
    get value() {
        return {
            id: this.id,
            displayName: this.displayName,
            slugifiedName: this.slugifiedName,
            type: this.type,
            creator: this.creator,
            isDefault: this.isDefault,
            isReadOnly: this.isReadOnly,
            displaySystemMessages: this.displaySystemMessages,
            messageCount: this.messageCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastModifiedAt: this.lastModifiedAt,
            customFields: this.customFields,
            userIds: this.userIds,
        };
    }
    getUsernames() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get usernames
            if (!this._USERNAMES) {
                this._USERNAMES = yield this[PrivateManager].getBridges().getInternalBridge().doGetUsernamesOfRoomById(this.id);
            }
            return this._USERNAMES;
        });
    }
    toJSON() {
        return this.value;
    }
    toString() {
        return this.value;
    }
    valueOf() {
        return this.value;
    }
}
exports.Room = Room;
//# sourceMappingURL=Room.js.map