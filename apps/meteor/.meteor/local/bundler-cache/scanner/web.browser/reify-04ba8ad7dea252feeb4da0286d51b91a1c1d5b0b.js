"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoginServices = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const AuthenticationContext_1 = require("../AuthenticationContext");
const useLoginServices = () => {
    const { queryLoginServices } = (0, react_1.useContext)(AuthenticationContext_1.AuthenticationContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => {
        return [queryLoginServices.subscribe, () => queryLoginServices.getCurrentValue()];
    }, [queryLoginServices]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useLoginServices = useLoginServices;
//# sourceMappingURL=useLoginServices.js.map