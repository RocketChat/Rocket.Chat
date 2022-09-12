let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v}},1);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},4);let EmailCodeFallback;module.link('../../common/EmailCodeFallback',{default(v){EmailCodeFallback=v}},5);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},6);var __assign = (this && this.__assign) || function () {
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







var AwaitingConfirmationPage = function (_a) {
    var securityCode = _a.securityCode, emailAddress = _a.emailAddress, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = useTranslation().t;
    return (_jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontScale: 'hero' }, { children: t('page.awaitingConfirmation.title') }), void 0), _jsx(Box, __assign({ fontScale: 'p1' }, { children: t('page.awaitingConfirmation.subtitle', { emailAddress: emailAddress }) }), void 0), _jsx(Box, __assign({ maxWidth: 498, padding: 'x18', width: 'full', fontSize: 'x22', lineHeight: 'x32', backgroundColor: colors.n700, borderRadius: 'x3' }, { children: securityCode }), void 0), _jsx(EmailCodeFallback, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }, void 0)] }), void 0) }), void 0) }, void 0));
};
module.exportDefault(AwaitingConfirmationPage);
//# sourceMappingURL=AwaitingConfirmationPage.js.map