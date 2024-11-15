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
var FormPageLayout_1 = __importDefault(require("../../common/FormPageLayout"));
var AwaitConfirmationForm_1 = __importDefault(require("../../forms/AwaitConfirmationForm"));
var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var AwaitingConfirmationPage = function (_a) {
    var title = _a.title, description = _a.description, currentStep = _a.currentStep, stepCount = _a.stepCount, securityCode = _a.securityCode, emailAddress = _a.emailAddress, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    return ((0, jsx_runtime_1.jsx)(layout_1.BackgroundLayer, { children: (0, jsx_runtime_1.jsx)(FormPageLayout_1.default, __assign({ title: title, styleProps: pageLayoutStyleProps, description: description }, { children: (0, jsx_runtime_1.jsx)(AwaitConfirmationForm_1.default, { currentStep: currentStep, stepCount: stepCount, securityCode: securityCode, emailAddress: emailAddress, onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }) })) }));
};
exports.default = AwaitingConfirmationPage;
//# sourceMappingURL=AwaitingConfirmationPage.js.map