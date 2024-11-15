"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToastBarDismiss = exports.useToastBarDispatch = exports.ToastBarContext = void 0;
var react_1 = require("react");
exports.ToastBarContext = (0, react_1.createContext)({
    dispatch: function () { return undefined; },
    dismiss: function () { return undefined; },
});
var useToastBarDispatch = function () {
    return (0, react_1.useContext)(exports.ToastBarContext).dispatch;
};
exports.useToastBarDispatch = useToastBarDispatch;
var useToastBarDismiss = function () {
    return (0, react_1.useContext)(exports.ToastBarContext).dismiss;
};
exports.useToastBarDismiss = useToastBarDismiss;
//# sourceMappingURL=ToastBarContext.js.map