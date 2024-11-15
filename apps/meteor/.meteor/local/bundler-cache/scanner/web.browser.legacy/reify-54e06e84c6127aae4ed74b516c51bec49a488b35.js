"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserSubscriptions = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const UserContext_1 = require("../UserContext");
const useUserSubscriptions = (query, options) => {
    const { querySubscriptions } = (0, react_1.useContext)(UserContext_1.UserContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => querySubscriptions(query, options), [querySubscriptions, query, options]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useUserSubscriptions = useUserSubscriptions;
//# sourceMappingURL=useUserSubscriptions.js.map