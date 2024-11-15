"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRole = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const AuthorizationContext_1 = require("../AuthorizationContext");
const useRole = (role) => {
    const { queryRole } = (0, react_1.useContext)(AuthorizationContext_1.AuthorizationContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => queryRole(role), [queryRole, role]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useRole = useRole;
//# sourceMappingURL=useRole.js.map