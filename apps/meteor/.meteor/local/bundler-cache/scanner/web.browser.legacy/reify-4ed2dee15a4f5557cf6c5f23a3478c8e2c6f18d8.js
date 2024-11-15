"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterContext = void 0;
const react_1 = require("react");
exports.RouterContext = (0, react_1.createContext)({
    subscribeToRouteChange: () => () => undefined,
    getLocationPathname: () => {
        throw new Error('not implemented');
    },
    getRouteParameters: () => {
        throw new Error('not implemented');
    },
    getLocationSearch: () => {
        throw new Error('not implemented');
    },
    getSearchParameters: () => {
        throw new Error('not implemented');
    },
    getRouteName: () => {
        throw new Error('not implemented');
    },
    buildRoutePath: () => {
        throw new Error('not implemented');
    },
    navigate: () => undefined,
    defineRoutes: () => () => undefined,
    getRoutes: () => {
        throw new Error('not implemented');
    },
    getRoomRoute: () => {
        throw new Error('not implemented');
    },
    subscribeToRoutesChange: () => () => undefined,
});
//# sourceMappingURL=RouterContext.js.map