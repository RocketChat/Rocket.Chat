"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLivechatFromApp = exports.isLivechatRoom = exports.OmnichannelSourceType = void 0;
const rooms_1 = require("../rooms");
var OmnichannelSourceType;
(function (OmnichannelSourceType) {
    OmnichannelSourceType["WIDGET"] = "widget";
    OmnichannelSourceType["EMAIL"] = "email";
    OmnichannelSourceType["SMS"] = "sms";
    OmnichannelSourceType["APP"] = "app";
    OmnichannelSourceType["OTHER"] = "other";
})(OmnichannelSourceType || (exports.OmnichannelSourceType = OmnichannelSourceType = {}));
const isLivechatRoom = (room) => {
    return room.type === rooms_1.RoomType.LIVE_CHAT;
};
exports.isLivechatRoom = isLivechatRoom;
const isLivechatFromApp = (room) => {
    return room.source && room.source.type === 'app';
};
exports.isLivechatFromApp = isLivechatFromApp;
//# sourceMappingURL=ILivechatRoom.js.map