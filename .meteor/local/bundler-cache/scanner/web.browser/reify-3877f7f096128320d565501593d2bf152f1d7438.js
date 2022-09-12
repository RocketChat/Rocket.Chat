let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},1);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},2);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},3);let TitleHighlight;module.link('../../common/FormPageLayout.styles',{TitleHighlight(v){TitleHighlight=v}},4);let RequestTrialForm;module.link('../../forms/RequestTrialForm',{default(v){RequestTrialForm=v}},5);let Description;module.link('./Description',{default(v){Description=v}},6);var __assign = (this && this.__assign) || function () {
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







var RequestTrialPage = function (props) {
    var t = useTranslation().t;
    return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ description: _jsx(Description, {}, void 0), title: _jsxs(Trans, __assign({ i18nKey: 'page.requestTrial.title' }, { children: ["Request a ", _jsx(TitleHighlight, { children: "30-day Trial" }, void 0)] }), void 0), subtitle: t('page.requestTrial.subtitle') }, { children: _jsx(RequestTrialForm, __assign({}, props), void 0) }), void 0) }, void 0));
};
module.exportDefault(RequestTrialPage);
//# sourceMappingURL=RequestTrialPage.js.map