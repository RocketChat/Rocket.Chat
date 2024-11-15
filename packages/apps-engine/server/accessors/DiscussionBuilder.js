"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscussionBuilder = void 0;
const RoomBuilder_1 = require("./RoomBuilder");
const metadata_1 = require("../../definition/metadata");
const rooms_1 = require("../../definition/rooms");
class DiscussionBuilder extends RoomBuilder_1.RoomBuilder {
    constructor(data) {
        super(data);
        this.kind = metadata_1.RocketChatAssociationModel.DISCUSSION;
        this.room.type = rooms_1.RoomType.PRIVATE_GROUP;
    }
    setParentRoom(parentRoom) {
        this.room.parentRoom = parentRoom;
        return this;
    }
    getParentRoom() {
        return this.room.parentRoom;
    }
    setReply(reply) {
        this.reply = reply;
        return this;
    }
    getReply() {
        return this.reply;
    }
    setParentMessage(parentMessage) {
        this.parentMessage = parentMessage;
        return this;
    }
    getParentMessage() {
        return this.parentMessage;
    }
}
exports.DiscussionBuilder = DiscussionBuilder;
//# sourceMappingURL=DiscussionBuilder.js.map