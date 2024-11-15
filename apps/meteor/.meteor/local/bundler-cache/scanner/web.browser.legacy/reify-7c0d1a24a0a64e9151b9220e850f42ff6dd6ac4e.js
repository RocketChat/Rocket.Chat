"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppId = exports.AppIdProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const UiKitContext_1 = require("./UiKitContext");
const AppIdContext = (0, react_1.createContext)(undefined);
const AppIdProvider = ({ children, appId }) => {
    if (!appId) {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
    }
    return ((0, jsx_runtime_1.jsx)(AppIdContext.Provider, { value: appId, children: children }));
};
exports.AppIdProvider = AppIdProvider;
const useAppId = () => {
    var _a, _b;
    const outerAppId = (_a = (0, react_1.useContext)(UiKitContext_1.UiKitContext).appId) !== null && _a !== void 0 ? _a : 'core';
    const appId = (_b = (0, react_1.useContext)(AppIdContext)) !== null && _b !== void 0 ? _b : outerAppId;
    (0, react_1.useDebugValue)(appId);
    return appId;
};
exports.useAppId = useAppId;
//# sourceMappingURL=AppIdContext.js.map