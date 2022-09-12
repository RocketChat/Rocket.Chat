let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},2);let ActionLink;module.link('../../common/ActionLink',{default(v){ActionLink=v}},3);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},4);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},5);let LoginForm;module.link('../../forms/LoginForm',{default(v){LoginForm=v}},6);let TotpForm;module.link('../../forms/TotpForm',{default(v){TotpForm=v}},7);var __assign = (this && this.__assign) || function () {
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};








var LoginPage = function (_a) {
    var onCreateAccount = _a.onCreateAccount, props = __rest(_a, ["onCreateAccount"]);
    var t = useTranslation().t;
    var isMfa = props.isMfa, mfaProps = props.mfaProps;
    return (_jsx(BackgroundLayer, { children: _jsxs(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontWeight: 500, width: '100%', mb: 'x18', fontSize: 'x42', lineHeight: 'x62', fontFamily: 'sans' }, { children: t('page.loginPage.title.cloud') }), void 0), _jsx(Box, __assign({ width: 'full', backgroundColor: 'white' }, { children: _jsx(Box, __assign({ fontScale: 'c1' }, { children: isMfa && !!mfaProps ? (_jsx(TotpForm, __assign({}, mfaProps), void 0)) : (_jsx(LoginForm, __assign({}, props), void 0)) }), void 0) }), void 0), _jsx(Box, __assign({ mb: 'x30', fontScale: 'p2' }, { children: !isMfa && (_jsxs(Trans, __assign({ i18nKey: 'page.loginPage.createAccount.label' }, { children: ["New here?", _jsx(ActionLink, __assign({ fontWeight: 400, fontScale: 'p2', onClick: onCreateAccount }, { children: "Create account" }), void 0)] }), void 0)) }), void 0)] }), void 0) }, void 0));
};
module.exportDefault(LoginPage);
//# sourceMappingURL=LoginPage.js.map