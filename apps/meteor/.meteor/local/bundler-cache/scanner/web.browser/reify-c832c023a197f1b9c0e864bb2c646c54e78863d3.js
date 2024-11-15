"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserPreference = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const UserContext_1 = require("../UserContext");
const useUserPreference = (key, defaultValue) => {
    const { queryPreference } = (0, react_1.useContext)(UserContext_1.UserContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => queryPreference(key, defaultValue), [queryPreference, key, defaultValue]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useUserPreference = useUserPreference;
//# sourceMappingURL=useUserPreference.js.map