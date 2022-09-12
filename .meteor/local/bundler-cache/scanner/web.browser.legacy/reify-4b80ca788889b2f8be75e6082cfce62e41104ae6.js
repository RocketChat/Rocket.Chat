"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUiKitStateValue = exports.useUiKitContext = exports.kitContext = exports.defaultContext = void 0;
var react_1 = require("react");
exports.defaultContext = {
    action: console.log,
    state: console.log,
    appId: 'core',
    errors: {},
    values: {},
};
exports.kitContext = react_1.createContext(exports.defaultContext);
var useUiKitContext = function () { return react_1.useContext(exports.kitContext); };
exports.useUiKitContext = useUiKitContext;
var useUiKitStateValue = function (actionId, initialValue) {
    var _a, _b;
    var _c = exports.useUiKitContext(), values = _c.values, errors = _c.errors;
    return {
        value: (_b = (values && ((_a = values[actionId]) === null || _a === void 0 ? void 0 : _a.value))) !== null && _b !== void 0 ? _b : initialValue,
        error: errors && errors[actionId],
    };
};
exports.useUiKitStateValue = useUiKitStateValue;
//# sourceMappingURL=kitContext.js.map