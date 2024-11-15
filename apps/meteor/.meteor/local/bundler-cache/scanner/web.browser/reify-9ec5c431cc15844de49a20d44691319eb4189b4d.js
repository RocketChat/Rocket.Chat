let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let BackgroundLayer,FormLayout;module.link('@rocket.chat/layout',{BackgroundLayer(v){BackgroundLayer=v},FormPageLayout(v){FormLayout=v}},1);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},2);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},3);let RequestTrialForm;module.link('../../forms/RequestTrialForm',{default(v){RequestTrialForm=v}},4);let Description;module.link('./Description',{default(v){Description=v}},5);var __assign = (this && this.__assign) || function () {
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
    return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ description: _jsx(Description, {}), title: _jsxs(Trans, __assign({ i18nKey: 'page.requestTrial.title' }, { children: ["Request a", _jsx(FormLayout.TitleHighlight, { children: "30-day Trial" })] })), subtitle: t('page.requestTrial.subtitle') }, { children: _jsx(RequestTrialForm, __assign({}, props)) })) }));
};
module.exportDefault(RequestTrialPage);
//# sourceMappingURL=RequestTrialPage.js.map