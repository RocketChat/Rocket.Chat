let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Label;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Label(v){Label=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},3);let EmailCodeFallback;module.link('../../common/EmailCodeFallback',{default(v){EmailCodeFallback=v}},4);var __assign = (this && this.__assign) || function () {
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





var AwaitingConfirmationForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, securityCode = _a.securityCode, emailAddress = _a.emailAddress, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = useTranslation().t;
    return (_jsxs(Form, { children: [_jsxs(Form.Header, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }), _jsx(Form.Title, { children: t('form.awaitConfirmationForm.title') })] }), _jsxs(Form.Container, { children: [_jsx(Box, __assign({ fontScale: 'p2', mbe: 24 }, { children: _jsxs(Trans, __assign({ i18nKey: 'form.awaitConfirmationForm.content.sentEmail' }, { children: ["Email sent to ", _jsx("strong", { children: { emailAddress: emailAddress } }), " with a confirmation link.Please verify that the security code below matches the one in the email."] })) })), _jsxs(Label, __assign({ display: 'block' }, { children: [t('form.awaitConfirmationForm.content.securityCode'), _jsx(Box, __assign({ padding: '12px', width: 'full', fontScale: 'p2b', lineHeight: '20px', backgroundColor: 'tint', elevation: '1' }, { children: securityCode }))] }))] }), _jsx(Form.Footer, { children: _jsx(EmailCodeFallback, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }) })] }));
};
module.exportDefault(AwaitingConfirmationForm);
//# sourceMappingURL=AwaitConfirmationForm.js.map