"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAtLeastOnePermission = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const AuthorizationContext_1 = require("../AuthorizationContext");
const useAtLeastOnePermission = (permissions, scope) => {
    const { queryAtLeastOnePermission } = (0, react_1.useContext)(AuthorizationContext_1.AuthorizationContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => queryAtLeastOnePermission(permissions, scope), [queryAtLeastOnePermission, permissions, scope]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useAtLeastOnePermission = useAtLeastOnePermission;
//# sourceMappingURL=useAtLeastOnePermission.js.map