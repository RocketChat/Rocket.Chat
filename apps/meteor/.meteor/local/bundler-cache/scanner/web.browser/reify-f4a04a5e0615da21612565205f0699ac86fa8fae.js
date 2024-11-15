let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let ActionLink,VerticalWizardLayout,VerticalWizardLayoutTitle,VerticalWizardLayoutForm,VerticalWizardLayoutFooter;module.link('@rocket.chat/layout',{ActionLink(v){ActionLink=v},VerticalWizardLayout(v){VerticalWizardLayout=v},VerticalWizardLayoutTitle(v){VerticalWizardLayoutTitle=v},VerticalWizardLayoutForm(v){VerticalWizardLayoutForm=v},VerticalWizardLayoutFooter(v){VerticalWizardLayoutFooter=v}},1);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},2);let LoginForm;module.link('../../forms/LoginForm',{default(v){LoginForm=v}},3);let TotpForm;module.link('../../forms/TotpForm',{default(v){TotpForm=v}},4);var __assign = (this && this.__assign) || function () {
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
    return (_jsxs(VerticalWizardLayout, { children: [_jsx(VerticalWizardLayoutTitle, { children: t('page.loginPage.title.cloud') }), _jsx(VerticalWizardLayoutForm, { children: isMfa && !!mfaProps ? (_jsx(TotpForm, __assign({}, mfaProps))) : (_jsx(LoginForm, __assign({}, props))) }), _jsx(VerticalWizardLayoutFooter, { children: !isMfa && (_jsxs(Trans, __assign({ i18nKey: 'page.loginPage.createAccount.label' }, { children: ["New here?", _jsx(ActionLink, __assign({ fontScale: 'p2', onClick: onCreateAccount }, { children: "Create account" }))] }))) })] }));
};
module.exportDefault(LoginPage);
//# sourceMappingURL=LoginPage.js.map