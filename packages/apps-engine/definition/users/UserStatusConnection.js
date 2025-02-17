"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatusConnection = void 0;
var UserStatusConnection;
(function (UserStatusConnection) {
    UserStatusConnection["OFFLINE"] = "offline";
    UserStatusConnection["ONLINE"] = "online";
    UserStatusConnection["AWAY"] = "away";
    UserStatusConnection["BUSY"] = "busy";
    UserStatusConnection["INVISIBLE"] = "invisible";
    /** This happens for livechat users and rocket.cat. */
    UserStatusConnection["UNDEFINED"] = "undefined";
})(UserStatusConnection || (exports.UserStatusConnection = UserStatusConnection = {}));
//# sourceMappingURL=UserStatusConnection.js.map