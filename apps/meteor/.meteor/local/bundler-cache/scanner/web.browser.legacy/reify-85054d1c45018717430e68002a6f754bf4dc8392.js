"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutLogo = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var logo_1 = require("@rocket.chat/logo");
var DarkModeProvider_1 = require("./DarkModeProvider");
var LayoutContext_1 = require("./contexts/LayoutContext");
var LayoutLogo = function () {
    var _a = (0, LayoutContext_1.useLayoutContext)(), logo = _a.logo, _b = _a.logoDark, logoDark = _b === void 0 ? logo : _b;
    var isDark = (0, DarkModeProvider_1.useDarkMode)();
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ width: '100%', maxWidth: 224 }, { children: (isDark ? logoDark : logo) || (0, jsx_runtime_1.jsx)(logo_1.RocketChatLogo, {}) })));
};
exports.LayoutLogo = LayoutLogo;
//# sourceMappingURL=LayoutLogo.js.map