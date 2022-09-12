let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v}},1);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},2);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},3);let EmailCodeFallback;module.link('../../common/EmailCodeFallback',{default(v){EmailCodeFallback=v}},4);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},5);var __assign = (this && this.__assign) || function () {
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






var LoginLinkEmailPage = function (_a) {
    var onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = useTranslation().t;
    return (_jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 800, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontScale: 'hero', width: '100%' }, { children: t('page.magicLinkEmail.title') }), void 0), _jsx(Box, __assign({ fontScale: 'p1', maxWidth: 570 }, { children: _jsx(Trans, { i18nKey: 'page.magicLinkEmail.subtitle' }, void 0) }), void 0), _jsx(EmailCodeFallback, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }, void 0)] }), void 0) }), void 0) }, void 0));
};
module.exportDefault(LoginLinkEmailPage);
//# sourceMappingURL=LoginLinkEmailPage.js.map