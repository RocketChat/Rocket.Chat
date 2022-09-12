let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let Box,Button;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v}},1);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},2);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},3);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},4);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},5);var __assign = (this && this.__assign) || function () {
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






var OauthAuthorizationPage = function (_a) {
    var clientName = _a.clientName, onClickAuthorizeOAuth = _a.onClickAuthorizeOAuth, error = _a.error;
    var t = useTranslation().t;
    var name = clientName || '...loading...';
    return (_jsx(BackgroundLayer, { children: _jsxs(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontWeight: 500, width: '100%', mbs: 'x24', mbe: 'x36', fontSize: 'x57', lineHeight: 'x62', fontFamily: 'sans' }, { children: t('page.oauthAuthorizationPage.title') }), void 0), _jsx(Box, __assign({ width: 'full', backgroundColor: 'white' }, { children: _jsx(Box, __assign({ fontScale: 'p1', p: 'x40', textAlign: 'start', color: colors.n900 }, { children: error.message ? (_jsxs(_Fragment, { children: [_jsx(Box, __assign({ fontScale: 'h1', mbe: 'x18' }, { children: "Error" }), void 0), error.message, _jsx(Box, __assign({ mbs: 'x24' }, { children: _jsx(Button, __assign({ onClick: error.onGoBack, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.goBack') }), void 0) }), void 0)] }, void 0)) : (_jsxs(_Fragment, { children: [_jsxs(Trans, __assign({ i18nKey: 'page.oauthAuthorizationPage.allowLogin', name: name }, { children: ["Do you wish to allow", _jsx("strong", { children: { name: name } }, void 0), "to login with your Rocket.Chat Cloud Account?"] }), void 0), _jsx(Box, __assign({ mbs: 'x24' }, { children: _jsx(Button, __assign({ onClick: onClickAuthorizeOAuth, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.authorize') }), void 0) }), void 0)] }, void 0)) }), void 0) }), void 0)] }), void 0) }, void 0));
};
module.exportDefault(OauthAuthorizationPage);
//# sourceMappingURL=OauthAuthorizationPage.js.map