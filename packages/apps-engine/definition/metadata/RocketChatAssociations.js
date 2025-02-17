"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RocketChatAssociationRecord = exports.RocketChatAssociationModel = void 0;
var RocketChatAssociationModel;
(function (RocketChatAssociationModel) {
    RocketChatAssociationModel["ROOM"] = "room";
    RocketChatAssociationModel["DISCUSSION"] = "discussion";
    RocketChatAssociationModel["MESSAGE"] = "message";
    RocketChatAssociationModel["LIVECHAT_MESSAGE"] = "livechat-message";
    RocketChatAssociationModel["USER"] = "user";
    RocketChatAssociationModel["FILE"] = "file";
    RocketChatAssociationModel["MISC"] = "misc";
    RocketChatAssociationModel["VIDEO_CONFERENCE"] = "video-conference";
})(RocketChatAssociationModel || (exports.RocketChatAssociationModel = RocketChatAssociationModel = {}));
class RocketChatAssociationRecord {
    constructor(model, id) {
        this.model = model;
        this.id = id;
    }
    getModel() {
        return this.model;
    }
    getID() {
        return this.id;
    }
}
exports.RocketChatAssociationRecord = RocketChatAssociationRecord;
//# sourceMappingURL=RocketChatAssociations.js.map