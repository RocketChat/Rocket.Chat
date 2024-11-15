"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoginWithToken = void 0;
const react_1 = require("react");
const AuthenticationContext_1 = require("../AuthenticationContext");
const useLoginWithToken = () => (0, react_1.useContext)(AuthenticationContext_1.AuthenticationContext).loginWithToken;
exports.useLoginWithToken = useLoginWithToken;
//# sourceMappingURL=useLoginWithToken.js.map