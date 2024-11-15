"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserType = void 0;
var UserType;
(function (UserType) {
    /** A user type for Rocket.Chat apps. */
    UserType["APP"] = "app";
    /** The user is a regular user of the system. */
    UserType["USER"] = "user";
    /** A special user type for bots. */
    UserType["BOT"] = "bot";
    /** This usually represents a livechat guest. */
    UserType["UNKNOWN"] = "unknown";
})(UserType || (exports.UserType = UserType = {}));
//# sourceMappingURL=UserType.js.map