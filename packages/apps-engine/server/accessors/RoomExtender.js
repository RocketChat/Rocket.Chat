"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomExtender = void 0;
const metadata_1 = require("../../definition/metadata");
const Utilities_1 = require("../misc/Utilities");
class RoomExtender {
    constructor(room) {
        this.room = room;
        this.kind = metadata_1.RocketChatAssociationModel.ROOM;
        this.members = [];
    }
    addCustomField(key, value) {
        if (!this.room.customFields) {
            this.room.customFields = {};
        }
        if (this.room.customFields[key]) {
            throw new Error(`The room already contains a custom field by the key: ${key}`);
        }
        if (key.includes('.')) {
            throw new Error(`The given key contains a period, which is not allowed. Key: ${key}`);
        }
        this.room.customFields[key] = value;
        return this;
    }
    addMember(user) {
        if (this.members.find((u) => u.username === user.username)) {
            throw new Error('The user is already in the room.');
        }
        this.members.push(user);
        return this;
    }
    getMembersBeingAdded() {
        return this.members;
    }
    getUsernamesOfMembersBeingAdded() {
        return this.members.map((u) => u.username);
    }
    getRoom() {
        return Utilities_1.Utilities.deepClone(this.room);
    }
}
exports.RoomExtender = RoomExtender;
//# sourceMappingURL=RoomExtender.js.map