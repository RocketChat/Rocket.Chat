"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserSubscriptionByName = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const UserContext_1 = require("../UserContext");
const useUserSubscriptionByName = (name, fields, sort) => {
    const { querySubscription } = (0, react_1.useContext)(UserContext_1.UserContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => querySubscription({ name }, fields, sort), [querySubscription, name, fields, sort]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useUserSubscriptionByName = useUserSubscriptionByName;
//# sourceMappingURL=useUserSubscriptionByName.js.map