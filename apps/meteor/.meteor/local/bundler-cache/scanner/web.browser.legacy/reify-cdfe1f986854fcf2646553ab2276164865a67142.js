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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var EmailCodeFallback_1 = __importDefault(require("../../common/EmailCodeFallback"));
var defaultSubtitleComponent = ((0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'page.checkYourEmail.subtitle' }, { children: ["Your request has been sent successfully.", (0, jsx_runtime_1.jsx)("br", {}), "Check your email inbox to launch your Enterprise trial."] })));
var CheckYourEmailPage = function (_a) {
    var title = _a.title, children = _a.children, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(layout_1.HeroLayout, { children: [(0, jsx_runtime_1.jsx)(layout_1.HeroLayoutTitle, { children: title || t('page.checkYourEmail.title') }), (0, jsx_runtime_1.jsx)(layout_1.HeroLayoutSubtitle, { children: children || defaultSubtitleComponent }), (0, jsx_runtime_1.jsx)(EmailCodeFallback_1.default, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest })] }));
};
exports.default = CheckYourEmailPage;
//# sourceMappingURL=CheckYourEmailPage.js.map