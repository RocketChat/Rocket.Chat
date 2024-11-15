"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoginWithService = void 0;
const react_1 = require("react");
const AuthenticationContext_1 = require("../AuthenticationContext");
const useLoginWithService = (service) => {
    const { loginWithService } = (0, react_1.useContext)(AuthenticationContext_1.AuthenticationContext);
    return (0, react_1.useMemo)(() => {
        return loginWithService(service);
    }, [loginWithService, service]);
};
exports.useLoginWithService = useLoginWithService;
//# sourceMappingURL=useLoginWithService.js.map