"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRolesDescription = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const AuthorizationContext_1 = require("../AuthorizationContext");
const useRolesDescription = () => {
    const { roleStore } = (0, react_1.useContext)(AuthorizationContext_1.AuthorizationContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => [
        (callback) => {
            roleStore.on('change', callback);
            return () => {
                roleStore.off('change', callback);
            };
        },
        () => roleStore.roles,
    ], [roleStore]);
    const roles = (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
    return (0, react_1.useCallback)((values) => values.map((role) => { var _a, _b; return ((_a = roles[role]) === null || _a === void 0 ? void 0 : _a.description) || ((_b = roles[role]) === null || _b === void 0 ? void 0 : _b.name) || role; }), [roles]);
};
exports.useRolesDescription = useRolesDescription;
//# sourceMappingURL=useRolesDescription.js.map