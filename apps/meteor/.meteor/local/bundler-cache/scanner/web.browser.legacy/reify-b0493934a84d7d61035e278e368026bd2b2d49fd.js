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
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var EmailCodeFallback_1 = __importDefault(require("../../common/EmailCodeFallback"));
var AwaitingConfirmationForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, securityCode = _a.securityCode, emailAddress = _a.emailAddress, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, { children: [(0, jsx_runtime_1.jsxs)(layout_1.Form.Header, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Steps, { currentStep: currentStep, stepCount: stepCount }), (0, jsx_runtime_1.jsx)(layout_1.Form.Title, { children: t('form.awaitConfirmationForm.title') })] }), (0, jsx_runtime_1.jsxs)(layout_1.Form.Container, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'p2', mbe: 24 }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'form.awaitConfirmationForm.content.sentEmail' }, { children: ["Email sent to ", (0, jsx_runtime_1.jsx)("strong", { children: { emailAddress: emailAddress } }), " with a confirmation link.Please verify that the security code below matches the one in the email."] })) })), (0, jsx_runtime_1.jsxs)(fuselage_1.Label, __assign({ display: 'block' }, { children: [t('form.awaitConfirmationForm.content.securityCode'), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ padding: '12px', width: 'full', fontScale: 'p2b', lineHeight: '20px', backgroundColor: 'tint', elevation: '1' }, { children: securityCode }))] }))] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(EmailCodeFallback_1.default, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }) })] }));
};
exports.default = AwaitingConfirmationForm;
//# sourceMappingURL=AwaitConfirmationForm.js.map