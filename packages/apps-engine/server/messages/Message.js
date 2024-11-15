"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const Room_1 = require("../rooms/Room");
class Message {
    get room() {
        return this._ROOM;
    }
    set room(room) {
        this._ROOM = new Room_1.Room(room, this.manager);
    }
    constructor(message, manager) {
        this.manager = manager;
        Object.assign(this, message);
    }
    get value() {
        return {
            id: this.id,
            sender: this.sender,
            text: this.text,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            editor: this.editor,
            editedAt: this.editedAt,
            emoji: this.emoji,
            avatarUrl: this.avatarUrl,
            alias: this.alias,
            attachments: this.attachments,
            reactions: this.reactions,
            groupable: this.groupable,
            parseUrls: this.parseUrls,
            customFields: this.customFields,
            threadId: this.threadId,
            room: this.room,
            file: this.file,
            blocks: this.blocks,
            starred: this.starred,
            pinned: this.pinned,
            pinnedAt: this.pinnedAt,
            pinnedBy: this.pinnedBy,
        };
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
exports.Message = Message;
//# sourceMappingURL=Message.js.map