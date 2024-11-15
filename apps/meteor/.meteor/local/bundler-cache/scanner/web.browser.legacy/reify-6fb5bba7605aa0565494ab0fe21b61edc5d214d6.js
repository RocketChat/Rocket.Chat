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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerticalWizardLayout = exports.VerticalWizardLayoutFooter = exports.VerticalWizardLayoutForm = exports.VerticalWizardLayoutTitle = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var BackgroundLayer_1 = __importDefault(require("../BackgroundLayer"));
var DarkModeProvider_1 = __importDefault(require("../DarkModeProvider"));
var LayoutLogo_1 = require("../LayoutLogo");
var LayoutContext_1 = require("../contexts/LayoutContext");
var VerticalWizardLayoutTitle = function (_a) {
    var children = _a.children;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontWeight: 500, width: '100%', mbe: 18, fontSize: 'x42', lineHeight: 'x62', fontFamily: 'sans' }, { children: children })));
};
exports.VerticalWizardLayoutTitle = VerticalWizardLayoutTitle;
var VerticalWizardLayoutForm = function (_a) {
    var children = _a.children;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Tile, __assign({ padding: 0, width: '100%' }, { children: children })));
};
exports.VerticalWizardLayoutForm = VerticalWizardLayoutForm;
var VerticalWizardLayoutFooter = function (_a) {
    var children = _a.children;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'flex', fontScale: 'p2', flexDirection: 'column', justifyContent: 'flex-end', pb: 32 }, { children: children })));
};
exports.VerticalWizardLayoutFooter = VerticalWizardLayoutFooter;
var VerticalWizardLayout = function (_a) {
    var children = _a.children, forceDarkMode = _a.forceDarkMode, rest = __rest(_a, ["children", "forceDarkMode"]);
    return ((0, jsx_runtime_1.jsx)(DarkModeProvider_1.default, __assign({ forcedDarkMode: forceDarkMode }, { children: (0, jsx_runtime_1.jsx)(LayoutContext_1.LayoutContext.Provider, __assign({ value: __assign({}, rest) }, { children: (0, jsx_runtime_1.jsx)(BackgroundLayer_1.default, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, pb: 32, pi: 16 }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ mb: 12 }, { children: (0, jsx_runtime_1.jsx)(LayoutLogo_1.LayoutLogo, {}) })), children] })) }) })) })));
};
exports.VerticalWizardLayout = VerticalWizardLayout;
//# sourceMappingURL=VerticalWizardLayout.js.map