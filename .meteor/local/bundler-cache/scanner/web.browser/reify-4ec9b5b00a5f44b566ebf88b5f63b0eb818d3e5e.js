let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v}},1);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},2);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},3);let EmailCodeFallback;module.link('../../common/EmailCodeFallback',{default(v){EmailCodeFallback=v}},4);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},5);var __assign = (this && this.__assign) || function () {
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






var CheckYourEmailPage = function (_a) {
    var title = _a.title, children = _a.children, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = useTranslation().t;
    var defaultSubtitleComponent = (_jsxs(Trans, __assign({ i18nKey: 'page.checkYourEmail.subtitle' }, { children: ["Your request has been sent successfully.", _jsx("br", {}, void 0), "Check your email inbox to launch your Enterprise trial."] }), void 0));
    title = title || t('page.checkYourEmail.title');
    children = children || defaultSubtitleComponent;
    return (_jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontScale: 'hero' }, { children: title }), void 0), _jsx(Box, __assign({ fontScale: 'p1' }, { children: children }), void 0), _jsx(EmailCodeFallback, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest }, void 0)] }), void 0) }), void 0) }, void 0));
};
module.exportDefault(CheckYourEmailPage);
//# sourceMappingURL=CheckYourEmailPage.js.map