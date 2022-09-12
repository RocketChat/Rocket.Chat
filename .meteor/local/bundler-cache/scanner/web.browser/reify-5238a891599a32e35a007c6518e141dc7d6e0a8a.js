let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},1);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},2);let CreateFirstMemberForm;module.link('../../forms/CreateFirstMemberForm',{default(v){CreateFirstMemberForm=v}},3);let TitleCreateFirstMemberPage;module.link('./TitleCreateFirstMemberPage',{default(v){TitleCreateFirstMemberPage=v}},4);var __assign = (this && this.__assign) || function () {
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





var CreateFirstMemberPage = function (props) {
    var pageLayoutStyleProps = {
        justifyContent: 'center',
    };
    return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ title: _jsx(TitleCreateFirstMemberPage, {}, void 0), styleProps: pageLayoutStyleProps }, { children: _jsx(CreateFirstMemberForm, __assign({}, props), void 0) }), void 0) }, void 0));
};
module.exportDefault(CreateFirstMemberPage);
//# sourceMappingURL=CreateFirstMemberPage.js.map