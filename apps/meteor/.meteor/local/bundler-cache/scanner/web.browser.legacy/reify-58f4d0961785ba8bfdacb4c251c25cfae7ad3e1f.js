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
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var LoginForm_1 = __importDefault(require("../../forms/LoginForm"));
var TotpForm_1 = __importDefault(require("../../forms/TotpForm"));
var LoginPage = function (_a) {
    var onCreateAccount = _a.onCreateAccount, props = __rest(_a, ["onCreateAccount"]);
    var t = (0, react_i18next_1.useTranslation)().t;
    var isMfa = props.isMfa, mfaProps = props.mfaProps;
    return ((0, jsx_runtime_1.jsxs)(layout_1.VerticalWizardLayout, { children: [(0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutTitle, { children: t('page.loginPage.title.cloud') }), (0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutForm, { children: isMfa && !!mfaProps ? ((0, jsx_runtime_1.jsx)(TotpForm_1.default, __assign({}, mfaProps))) : ((0, jsx_runtime_1.jsx)(LoginForm_1.default, __assign({}, props))) }), (0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutFooter, { children: !isMfa && ((0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'page.loginPage.createAccount.label' }, { children: ["New here?", (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ fontScale: 'p2', onClick: onCreateAccount }, { children: "Create account" }))] }))) })] }));
};
exports.default = LoginPage;
//# sourceMappingURL=LoginPage.js.map