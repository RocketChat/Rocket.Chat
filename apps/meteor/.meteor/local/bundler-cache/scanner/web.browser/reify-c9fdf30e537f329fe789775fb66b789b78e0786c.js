"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouteParameter = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const RouterContext_1 = require("../RouterContext");
const useRouteParameter = (name) => {
    const router = (0, react_1.useContext)(RouterContext_1.RouterContext);
    const getSnapshot = (0, react_1.useCallback)(() => {
        return router.getRouteParameters()[name];
    }, [router, name]);
    return (0, shim_1.useSyncExternalStore)(router.subscribeToRouteChange, getSnapshot);
};
exports.useRouteParameter = useRouteParameter;
//# sourceMappingURL=useRouteParameter.js.map