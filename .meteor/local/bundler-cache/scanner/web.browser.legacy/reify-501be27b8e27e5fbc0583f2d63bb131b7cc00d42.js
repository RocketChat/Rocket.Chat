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
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var react_i18next_1 = require("react-i18next");
var ActionLink_1 = __importDefault(require("../../common/ActionLink"));
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var OnboardingLogo_1 = require("../../common/OnboardingLogo");
var LoginForm_1 = __importDefault(require("../../forms/LoginForm"));
var TotpForm_1 = __importDefault(require("../../forms/TotpForm"));
var LoginPage = function (_a) {
    var onCreateAccount = _a.onCreateAccount, props = __rest(_a, ["onCreateAccount"]);
    var t = react_i18next_1.useTranslation().t;
    var isMfa = props.isMfa, mfaProps = props.mfaProps;
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: [jsx_runtime_1.jsx(OnboardingLogo_1.OnboardingLogo, {}, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontWeight: 500, width: '100%', mb: 'x18', fontSize: 'x42', lineHeight: 'x62', fontFamily: 'sans' }, { children: t('page.loginPage.title.cloud') }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ width: 'full', backgroundColor: 'white' }, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'c1' }, { children: isMfa && !!mfaProps ? (jsx_runtime_1.jsx(TotpForm_1.default, __assign({}, mfaProps), void 0)) : (jsx_runtime_1.jsx(LoginForm_1.default, __assign({}, props), void 0)) }), void 0) }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mb: 'x30', fontScale: 'p2' }, { children: !isMfa && (jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.loginPage.createAccount.label' }, { children: ["New here?", jsx_runtime_1.jsx(ActionLink_1.default, __assign({ fontWeight: 400, fontScale: 'p2', onClick: onCreateAccount }, { children: "Create account" }), void 0)] }), void 0)) }), void 0)] }), void 0) }, void 0));
};
exports.default = LoginPage;
//# sourceMappingURL=LoginPage.js.map