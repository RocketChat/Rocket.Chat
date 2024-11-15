"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDarkMode = exports.Provider = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
var react_1 = require("react");
var DarkModeContext = (0, react_1.createContext)(true);
var Provider = function (_a) {
    var children = _a.children, forcedDarkMode = _a.forcedDarkMode;
    var value = (0, fuselage_hooks_1.useDarkMode)(forcedDarkMode);
    return (0, jsx_runtime_1.jsx)(DarkModeContext.Provider, { children: children, value: value });
};
exports.Provider = Provider;
var useDarkMode = function () { return (0, react_1.useContext)(DarkModeContext); };
exports.useDarkMode = useDarkMode;
// TODO: remove
exports.default = exports.Provider;
//# sourceMappingURL=DarkModeProvider.js.map