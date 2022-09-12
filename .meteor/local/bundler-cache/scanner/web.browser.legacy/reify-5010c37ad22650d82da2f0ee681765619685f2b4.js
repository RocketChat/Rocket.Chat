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
var fuselage_1 = require("@rocket.chat/fuselage");
var react_i18next_1 = require("react-i18next");
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var EmailCodeFallback_1 = __importDefault(require("../../common/EmailCodeFallback"));
var OnboardingLogo_1 = require("../../common/OnboardingLogo");
var CheckYourEmailPage = function (_a) {
    var title = _a.title, children = _a.children, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = react_i18next_1.useTranslation().t;
    var defaultSubtitleComponent = (jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.checkYourEmail.subtitle' }, { children: ["Your request has been sent successfully.", jsx_runtime_1.jsx("br", {}, void 0), "Check your email inbox to launch your Enterprise trial."] }), void 0));
    title = title || t('page.checkYourEmail.title');
    children = children || defaultSubtitleComponent;
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: jsx_runtime_1.jsxs(fuselage_1.Margins, __assign({ blockEnd: 32 }, { children: [jsx_runtime_1.jsx(OnboardingLogo_1.OnboardingLogo, {}, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'hero' }, { children: title }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'p1' }, { children: children }), void 0), jsx_runtime_1.jsx(EmailCodeFallback_1.default, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }, void 0)] }), void 0) }), void 0) }, void 0));
};
exports.default = CheckYourEmailPage;
//# sourceMappingURL=CheckYourEmailPage.js.map