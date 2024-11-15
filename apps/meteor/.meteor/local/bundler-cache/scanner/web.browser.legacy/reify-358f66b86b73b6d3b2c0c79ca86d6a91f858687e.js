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
var NewAccountForm_1 = __importDefault(require("../../forms/NewAccountForm"));
var CreateNewAccountPage = function (_a) {
    var onLogin = _a.onLogin, props = __rest(_a, ["onLogin"]);
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(layout_1.VerticalWizardLayout, { children: [(0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutTitle, { children: t('page.newAccountForm.title') }), (0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutForm, { children: (0, jsx_runtime_1.jsx)(NewAccountForm_1.default, __assign({}, props)) }), (0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutFooter, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'component.createNewAccountPage' }, { children: ["Already registered?", (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ fontScale: 'h4', onClick: onLogin }, { children: "Go to login" }))] })) })] }));
};
exports.default = CreateNewAccountPage;
//# sourceMappingURL=CreateNewAccountPage.js.map