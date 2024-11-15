"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePermission = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const AuthorizationContext_1 = require("../AuthorizationContext");
const usePermission = (permission, scope) => {
    const { queryPermission } = (0, react_1.useContext)(AuthorizationContext_1.AuthorizationContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => queryPermission(permission, scope), [queryPermission, permission, scope]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.usePermission = usePermission;
//# sourceMappingURL=usePermission.js.map