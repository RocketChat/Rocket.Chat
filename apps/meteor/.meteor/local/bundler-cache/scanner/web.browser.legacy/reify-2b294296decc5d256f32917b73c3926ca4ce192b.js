"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_dom_1 = require("react-dom");
var createAnchor_1 = require("./lib/utils/createAnchor");
var deleteAnchor_1 = require("./lib/utils/deleteAnchor");
var ToastBarPortal = function (_a) {
    var children = _a.children;
    var toastBarRoot = (0, react_1.useState)(function () { return (0, createAnchor_1.createAnchor)('toastBarRoot'); })[0];
    (0, react_1.useEffect)(function () { return function () { return (0, deleteAnchor_1.deleteAnchor)(toastBarRoot); }; }, [toastBarRoot]);
    return (0, react_dom_1.createPortal)(children, toastBarRoot);
};
exports.default = (0, react_1.memo)(ToastBarPortal);
//# sourceMappingURL=ToastBarPortal.js.map