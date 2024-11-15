"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserRoom = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const UserContext_1 = require("../UserContext");
const useUserRoom = (rid, fields) => {
    const { queryRoom } = (0, react_1.useContext)(UserContext_1.UserContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => queryRoom({ _id: rid }, fields), [queryRoom, rid, fields]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useUserRoom = useUserRoom;
//# sourceMappingURL=useUserRoom.js.map