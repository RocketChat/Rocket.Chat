"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDarkMode = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
var react_1 = require("react");
var DarkModeContext = react_1.createContext(true);
var DarkModeProvider = function (_a) {
    var children = _a.children, forcedDarkMode = _a.forcedDarkMode;
    var value = fuselage_hooks_1.useDarkMode(forcedDarkMode);
    return jsx_runtime_1.jsx(DarkModeContext.Provider, { children: children, value: value }, void 0);
};
exports.default = DarkModeProvider;
var useDarkMode = function () { return react_1.useContext(DarkModeContext); };
exports.useDarkMode = useDarkMode;
//# sourceMappingURL=DarkModeProvider.js.map