"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageActionContext = exports.RoomTypeFilter = void 0;
var RoomTypeFilter;
(function (RoomTypeFilter) {
    RoomTypeFilter["PUBLIC_CHANNEL"] = "public_channel";
    RoomTypeFilter["PRIVATE_CHANNEL"] = "private_channel";
    RoomTypeFilter["PUBLIC_TEAM"] = "public_team";
    RoomTypeFilter["PRIVATE_TEAM"] = "private_team";
    RoomTypeFilter["PUBLIC_DISCUSSION"] = "public_discussion";
    RoomTypeFilter["PRIVATE_DISCUSSION"] = "private_discussion";
    RoomTypeFilter["DIRECT"] = "direct";
    RoomTypeFilter["DIRECT_MULTIPLE"] = "direct_multiple";
    RoomTypeFilter["LIVE_CHAT"] = "livechat";
})(RoomTypeFilter || (exports.RoomTypeFilter = RoomTypeFilter = {}));
var MessageActionContext;
(function (MessageActionContext) {
    MessageActionContext["MESSAGE"] = "message";
    MessageActionContext["MESSAGE_MOBILE"] = "message-mobile";
    MessageActionContext["THREADS"] = "threads";
    MessageActionContext["STARRED"] = "starred";
})(MessageActionContext || (exports.MessageActionContext = MessageActionContext = {}));
//# sourceMappingURL=IUIActionButtonDescriptor.js.map