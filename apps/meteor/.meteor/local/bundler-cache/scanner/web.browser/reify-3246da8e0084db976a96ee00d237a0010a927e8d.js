let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let HeroLayout,HeroLayoutTitle,HeroLayoutSubtitle;module.link('@rocket.chat/layout',{HeroLayout(v){HeroLayout=v},HeroLayoutTitle(v){HeroLayoutTitle=v},HeroLayoutSubtitle(v){HeroLayoutSubtitle=v}},1);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},2);let EmailCodeFallback;module.link('../../common/EmailCodeFallback',{default(v){EmailCodeFallback=v}},3);var __assign = (this && this.__assign) || function () {
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




var defaultSubtitleComponent = (_jsxs(Trans, __assign({ i18nKey: 'page.checkYourEmail.subtitle' }, { children: ["Your request has been sent successfully.", _jsx("br", {}), "Check your email inbox to launch your Enterprise trial."] })));
var CheckYourEmailPage = function (_a) {
    var title = _a.title, children = _a.children, onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    var t = useTranslation().t;
    return (_jsxs(HeroLayout, { children: [_jsx(HeroLayoutTitle, { children: title || t('page.checkYourEmail.title') }), _jsx(HeroLayoutSubtitle, { children: children || defaultSubtitleComponent }), _jsx(EmailCodeFallback, { onResendEmailRequest: onResendEmailRequest, onChangeEmailRequest: onChangeEmailRequest })] }));
};
module.exportDefault(CheckYourEmailPage);
//# sourceMappingURL=CheckYourEmailPage.js.map