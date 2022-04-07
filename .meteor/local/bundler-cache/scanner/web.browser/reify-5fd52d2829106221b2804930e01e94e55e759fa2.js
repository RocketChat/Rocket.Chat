let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Trans;module.link('react-i18next',{Trans(v){Trans=v}},1);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},2);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},3);let Title,TitleHighlight;module.link('../../common/FormPageLayout.styles',{Title(v){Title=v},TitleHighlight(v){TitleHighlight=v}},4);let StandaloneServerForm;module.link('../../forms/StandaloneServerForm',{default(v){StandaloneServerForm=v}},5);var __assign = (this && this.__assign) || function () {
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






var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var StandaloneServerPage = function (props) { return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ title: _jsx(Title, { children: _jsxs(Trans, __assign({ i18nKey: 'page.form.title' }, { children: ["Let's", _jsx(TitleHighlight, { children: "Launch" }, void 0), "Your Workspace"] }), void 0) }, void 0), styleProps: pageLayoutStyleProps }, { children: _jsx(StandaloneServerForm, __assign({}, props), void 0) }), void 0) }, void 0)); };
module.exportDefault(StandaloneServerPage);
//# sourceMappingURL=StandaloneServerPage.js.map