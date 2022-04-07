let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},2);let ActionLink;module.link('../../common/ActionLink',{default(v){ActionLink=v}},3);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},4);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},5);let NewAccountForm;module.link('../../forms/NewAccountForm',{default(v){NewAccountForm=v}},6);var __assign = (this && this.__assign) || function () {
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







var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var CreateNewAccountPage = function (_a) {
    var onLogin = _a.onLogin, props = __rest(_a, ["onLogin"]);
    var t = useTranslation().t;
    return (_jsx(BackgroundLayer, { children: _jsxs(FormPageLayout, __assign({ title: t('page.newAccountForm.title'), styleProps: pageLayoutStyleProps }, { children: [_jsx(NewAccountForm, __assign({}, props), void 0), _jsx(Box, __assign({ fontScale: 'h4', pbs: 'x40' }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.createNewAccountPage' }, { children: ["Already registered?", _jsx(ActionLink, __assign({ fontScale: 'h4', onClick: onLogin }, { children: "Go to login" }), void 0)] }), void 0) }), void 0)] }), void 0) }, void 0));
};
module.exportDefault(CreateNewAccountPage);
//# sourceMappingURL=CreateNewAccountPage.js.map