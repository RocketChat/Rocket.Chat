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
var FormPageLayout_1 = __importDefault(require("../../common/FormPageLayout"));
var NewAccountForm_1 = __importDefault(require("../../forms/NewAccountForm"));
var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var CreateNewAccountPage = function (_a) {
    var onLogin = _a.onLogin, props = __rest(_a, ["onLogin"]);
    var t = react_i18next_1.useTranslation().t;
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsxs(FormPageLayout_1.default, __assign({ title: t('page.newAccountForm.title'), styleProps: pageLayoutStyleProps }, { children: [jsx_runtime_1.jsx(NewAccountForm_1.default, __assign({}, props), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'h4', pbs: 'x40' }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'component.createNewAccountPage' }, { children: ["Already registered?", jsx_runtime_1.jsx(ActionLink_1.default, __assign({ fontScale: 'h4', onClick: onLogin }, { children: "Go to login" }), void 0)] }), void 0) }), void 0)] }), void 0) }, void 0));
};
exports.default = CreateNewAccountPage;
//# sourceMappingURL=CreateNewAccountPage.js.map