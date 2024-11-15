"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserId = void 0;
const react_1 = require("react");
const UserContext_1 = require("../UserContext");
const useUserId = () => (0, react_1.useContext)(UserContext_1.UserContext).userId;
exports.useUserId = useUserId;
//# sourceMappingURL=useUserId.js.map