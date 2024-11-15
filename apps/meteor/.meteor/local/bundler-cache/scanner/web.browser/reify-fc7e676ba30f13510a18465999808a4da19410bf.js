let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let BackgroundLayer;module.link('@rocket.chat/layout',{BackgroundLayer(v){BackgroundLayer=v}},1);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},2);let AwaitingConfirmationForm;module.link('../../forms/AwaitConfirmationForm',{default(v){AwaitingConfirmationForm=v}},3);var __assign = (this && this.__assign) || function () {
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




var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var AwaitingConfirmationPage = function (_a) {
    var title = _a.title, description = _a.description, currentStep = _a.currentStep, stepCount = _a.stepCount, securityCode = _a.securityCode, emailAddress = _a.emailAddress, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ title: title, styleProps: pageLayoutStyleProps, description: description }, { children: _jsx(AwaitingConfirmationForm, { currentStep: currentStep, stepCount: stepCount, securityCode: securityCode, emailAddress: emailAddress, onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }) })) }));
};
module.exportDefault(AwaitingConfirmationPage);
//# sourceMappingURL=AwaitingConfirmationPage.js.map