"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSession = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const SessionContext_1 = require("../SessionContext");
const useSession = (name) => {
    const { query } = (0, react_1.useContext)(SessionContext_1.SessionContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => query(name), [query, name]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useSession = useSession;
//# sourceMappingURL=useSession.js.map