"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentRoutePath = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const RouterContext_1 = require("../RouterContext");
const useCurrentRoutePath = () => {
    const router = (0, react_1.useContext)(RouterContext_1.RouterContext);
    const getSnapshot = (0, react_1.useCallback)(() => {
        const name = router.getRouteName();
        return name
            ? router.buildRoutePath({
                name,
                params: router.getRouteParameters(),
                search: router.getSearchParameters(),
            })
            : undefined;
    }, [router]);
    return (0, shim_1.useSyncExternalStore)(router.subscribeToRouteChange, getSnapshot);
};
exports.useCurrentRoutePath = useCurrentRoutePath;
//# sourceMappingURL=useCurrentRoutePath.js.map