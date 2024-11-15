let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let ActionLink,VerticalWizardLayout,VerticalWizardLayoutFooter,VerticalWizardLayoutForm,VerticalWizardLayoutTitle;module.link('@rocket.chat/layout',{ActionLink(v){ActionLink=v},VerticalWizardLayout(v){VerticalWizardLayout=v},VerticalWizardLayoutFooter(v){VerticalWizardLayoutFooter=v},VerticalWizardLayoutForm(v){VerticalWizardLayoutForm=v},VerticalWizardLayoutTitle(v){VerticalWizardLayoutTitle=v}},1);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},2);let NewAccountForm;module.link('../../forms/NewAccountForm',{default(v){NewAccountForm=v}},3);var __assign = (this && this.__assign) || function () {
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




var CreateNewAccountPage = function (_a) {
    var onLogin = _a.onLogin, props = __rest(_a, ["onLogin"]);
    var t = useTranslation().t;
    return (_jsxs(VerticalWizardLayout, { children: [_jsx(VerticalWizardLayoutTitle, { children: t('page.newAccountForm.title') }), _jsx(VerticalWizardLayoutForm, { children: _jsx(NewAccountForm, __assign({}, props)) }), _jsx(VerticalWizardLayoutFooter, { children: _jsxs(Trans, __assign({ i18nKey: 'component.createNewAccountPage' }, { children: ["Already registered?", _jsx(ActionLink, __assign({ fontScale: 'h4', onClick: onLogin }, { children: "Go to login" }))] })) })] }));
};
module.exportDefault(CreateNewAccountPage);
//# sourceMappingURL=CreateNewAccountPage.js.map