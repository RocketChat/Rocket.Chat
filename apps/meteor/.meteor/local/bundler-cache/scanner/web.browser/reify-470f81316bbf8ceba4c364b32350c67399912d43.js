"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUser = void 0;
const react_1 = require("react");
const UserContext_1 = require("../UserContext");
const useUser = () => (0, react_1.useContext)(UserContext_1.UserContext).user;
exports.useUser = useUser;
//# sourceMappingURL=useUser.js.map