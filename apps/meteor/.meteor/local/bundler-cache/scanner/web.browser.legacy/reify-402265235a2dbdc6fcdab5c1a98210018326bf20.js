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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.HorizontalWizardLayoutFooter = exports.HorizontalWizardLayoutCaption = exports.HorizontalWizardLayoutContent = exports.HorizontalWizardTextHighlight = exports.HorizontalWizardLayoutDescription = exports.HorizontalWizardLayoutSubtitle = exports.HorizontalWizardLayoutTitle = exports.HorizontalWizardLayoutAside = exports.HorizontalWizardLayout = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var BackgroundLayer_1 = __importDefault(require("../BackgroundLayer"));
var DarkModeProvider_1 = __importStar(require("../DarkModeProvider"));
var FormPageLayout = __importStar(require("../FormPageLayout/FormPageLayout.styles"));
var LayoutLogo_1 = require("../LayoutLogo");
var LayoutContext_1 = require("../contexts/LayoutContext");
var HorizontalWizardLayout = function (_a) {
    var children = _a.children, forceDarkMode = _a.forceDarkMode, rest = __rest(_a, ["children", "forceDarkMode"]);
    return ((0, jsx_runtime_1.jsx)(DarkModeProvider_1.default, __assign({ forcedDarkMode: forceDarkMode }, { children: (0, jsx_runtime_1.jsx)(LayoutContext_1.LayoutContext.Provider, __assign({ value: __assign({}, rest) }, { children: (0, jsx_runtime_1.jsx)(BackgroundLayer_1.default, { children: (0, jsx_runtime_1.jsx)(FormPageLayout.Wrapper, { children: children }) }) })) })));
};
exports.HorizontalWizardLayout = HorizontalWizardLayout;
var HorizontalWizardLayoutAside = function (_a) {
    var children = _a.children;
    return ((0, jsx_runtime_1.jsxs)(FormPageLayout.Aside, { children: [(0, jsx_runtime_1.jsx)(FormPageLayout.Logo, { children: (0, jsx_runtime_1.jsx)(LayoutLogo_1.LayoutLogo, {}) }), children] }));
};
exports.HorizontalWizardLayoutAside = HorizontalWizardLayoutAside;
var HorizontalWizardLayoutTitle = function (props) { return (0, jsx_runtime_1.jsx)(FormPageLayout.Title, __assign({}, props)); };
exports.HorizontalWizardLayoutTitle = HorizontalWizardLayoutTitle;
var HorizontalWizardLayoutSubtitle = function (props) { return (0, jsx_runtime_1.jsx)(FormPageLayout.Subtitle, __assign({}, props)); };
exports.HorizontalWizardLayoutSubtitle = HorizontalWizardLayoutSubtitle;
var HorizontalWizardLayoutDescription = function (props) { return (0, jsx_runtime_1.jsx)(FormPageLayout.Description, __assign({}, props)); };
exports.HorizontalWizardLayoutDescription = HorizontalWizardLayoutDescription;
var HorizontalWizardTextHighlight = function (props) {
    var isDark = (0, DarkModeProvider_1.useDarkMode)();
    return (0, jsx_runtime_1.jsx)(FormPageLayout.TitleHighlight, __assign({}, props, { isDark: isDark }));
};
exports.HorizontalWizardTextHighlight = HorizontalWizardTextHighlight;
var HorizontalWizardLayoutContent = function (_a) {
    var children = _a.children;
    return (0, jsx_runtime_1.jsx)(FormPageLayout.Content, { children: children });
};
exports.HorizontalWizardLayoutContent = HorizontalWizardLayoutContent;
var HorizontalWizardLayoutCaption = function (_a) {
    var children = _a.children;
    var isDark = (0, DarkModeProvider_1.useDarkMode)();
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'inline-block', flexDirection: 'row', fontScale: 'c1', color: isDark ? 'white' : 'secondary-info', mb: 16, alignItems: 'center' }, { children: children })));
};
exports.HorizontalWizardLayoutCaption = HorizontalWizardLayoutCaption;
var HorizontalWizardLayoutFooter = function (_a) {
    var children = _a.children;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'flex', fontScale: 'h4', flexDirection: 'column', alignItems: 'center' }, { children: children })));
};
exports.HorizontalWizardLayoutFooter = HorizontalWizardLayoutFooter;
//# sourceMappingURL=HorizontalWizardLayout.js.map