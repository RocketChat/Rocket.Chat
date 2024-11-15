"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserState = void 0;
// User state is based on whether the User has sent an invite(UAC) or it
// has received an invite (UAS)
var UserState;
(function (UserState) {
    UserState[UserState["IDLE"] = 0] = "IDLE";
    UserState[UserState["UAC"] = 1] = "UAC";
    UserState[UserState["UAS"] = 2] = "UAS";
})(UserState || (exports.UserState = UserState = {}));
//# sourceMappingURL=UserState.js.map