let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let Box,Button;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v}},1);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},2);let VerticalWizardLayout,VerticalWizardLayoutTitle,VerticalWizardLayoutForm;module.link('@rocket.chat/layout',{VerticalWizardLayout(v){VerticalWizardLayout=v},VerticalWizardLayoutTitle(v){VerticalWizardLayoutTitle=v},VerticalWizardLayoutForm(v){VerticalWizardLayoutForm=v}},3);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},4);var __assign = (this && this.__assign) || function () {
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
    return (_jsxs(VerticalWizardLayout, { children: [_jsx(VerticalWizardLayoutTitle, { children: t('page.oauthAuthorizationPage.title') }), _jsx(VerticalWizardLayoutForm, { children: _jsx(Box, __assign({ fontScale: 'p1', p: 40, textAlign: 'start', color: colors.n900 }, { children: !clientName || error.message ? (_jsxs(_Fragment, { children: [_jsx(Box, __assign({ fontScale: 'h1', mbe: 18 }, { children: "Error" })), error.message, _jsx(Box, __assign({ mbs: 24 }, { children: _jsx(Button, __assign({ onClick: error.onGoBack, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.goBack') })) }))] })) : (_jsxs(_Fragment, { children: [_jsxs(Trans, __assign({ i18nKey: 'page.oauthAuthorizationPage.allowLogin', name: clientName }, { children: ["Do you wish to allow", _jsx("strong", { children: { clientName: clientName } }), "to login with your Rocket.Chat Cloud Account?"] })), _jsx(Box, __assign({ mbs: 24 }, { children: _jsx(Button, __assign({ onClick: onClickAuthorizeOAuth, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.authorize') })) }))] })) })) })] }));
};
module.exportDefault(OauthAuthorizationPage);
//# sourceMappingURL=OauthAuthorizationPage.js.map