"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchParameters = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const RouterContext_1 = require("../RouterContext");
const useSearchParameters = () => {
    const { getSearchParameters, subscribeToRouteChange } = (0, react_1.useContext)(RouterContext_1.RouterContext);
    return (0, shim_1.useSyncExternalStore)(subscribeToRouteChange, getSearchParameters);
};
exports.useSearchParameters = useSearchParameters;
//# sourceMappingURL=useSearchParameters.js.map