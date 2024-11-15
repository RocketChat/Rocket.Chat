"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchParameter = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const RouterContext_1 = require("../RouterContext");
const useSearchParameter = (name) => {
    const { getSearchParameters, subscribeToRouteChange } = (0, react_1.useContext)(RouterContext_1.RouterContext);
    const getSnapshot = (0, react_1.useCallback)(() => {
        const searchParameters = getSearchParameters();
        return searchParameters[name];
    }, [getSearchParameters, name]);
    return (0, shim_1.useSyncExternalStore)(subscribeToRouteChange, getSnapshot);
};
exports.useSearchParameter = useSearchParameter;
//# sourceMappingURL=useSearchParameter.js.map