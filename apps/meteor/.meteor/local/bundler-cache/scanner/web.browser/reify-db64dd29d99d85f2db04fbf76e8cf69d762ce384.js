"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoginWithPassword = void 0;
const react_1 = require("react");
const AuthenticationContext_1 = require("../AuthenticationContext");
const useLoginWithPassword = () => (0, react_1.useContext)(AuthenticationContext_1.AuthenticationContext).loginWithPassword;
exports.useLoginWithPassword = useLoginWithPassword;
//# sourceMappingURL=useLoginWithPassword.js.map