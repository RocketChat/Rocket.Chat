"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePermissionWithScopedRoles = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const AuthorizationContext_1 = require("../AuthorizationContext");
/**
 * Check if the user has the permission considering the user have the scoped roles
 * @param permission The permission to check
 * @param scopedRoles The roles to be also considered
 * @returns boolean
 */
const usePermissionWithScopedRoles = (permission, scopedRoles) => {
    const { queryPermission } = (0, react_1.useContext)(AuthorizationContext_1.AuthorizationContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => queryPermission(permission, undefined, scopedRoles), [queryPermission, permission, scopedRoles]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.usePermissionWithScopedRoles = usePermissionWithScopedRoles;
//# sourceMappingURL=usePermissionWithScopedRoles.js.map