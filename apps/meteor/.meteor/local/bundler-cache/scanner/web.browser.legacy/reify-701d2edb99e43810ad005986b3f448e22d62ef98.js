"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserSubscription = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const UserContext_1 = require("../UserContext");
const useUserSubscription = (rid, fields) => {
    const { querySubscription } = (0, react_1.useContext)(UserContext_1.UserContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => querySubscription({ rid }, fields), [querySubscription, rid, fields]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useUserSubscription = useUserSubscription;
//# sourceMappingURL=useUserSubscription.js.map