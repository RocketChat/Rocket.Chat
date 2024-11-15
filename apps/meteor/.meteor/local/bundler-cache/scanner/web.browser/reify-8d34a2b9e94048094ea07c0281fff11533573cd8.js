let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let HorizontalWizardLayout,HorizontalWizardLayoutAside,HorizontalWizardLayoutTitle,HorizontalWizardLayoutSubtitle,HorizontalWizardLayoutDescription,HorizontalWizardLayoutContent;module.link('@rocket.chat/layout',{HorizontalWizardLayout(v){HorizontalWizardLayout=v},HorizontalWizardLayoutAside(v){HorizontalWizardLayoutAside=v},HorizontalWizardLayoutTitle(v){HorizontalWizardLayoutTitle=v},HorizontalWizardLayoutSubtitle(v){HorizontalWizardLayoutSubtitle=v},HorizontalWizardLayoutDescription(v){HorizontalWizardLayoutDescription=v},HorizontalWizardLayoutContent(v){HorizontalWizardLayoutContent=v}},1);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},2);


var FormPageLayoutOnboard = function (_a) {
    var title = _a.title, subtitle = _a.subtitle, description = _a.description, children = _a.children;
    var t = useTranslation().t;
    return (_jsxs(HorizontalWizardLayout, { children: [_jsxs(HorizontalWizardLayoutAside, { children: [_jsx(HorizontalWizardLayoutTitle, { children: title || t('page.form.title') }), subtitle && (_jsx(HorizontalWizardLayoutSubtitle, { children: subtitle })), _jsx(HorizontalWizardLayoutDescription, { children: description })] }), _jsx(HorizontalWizardLayoutContent, { children: children })] }));
};
module.exportDefault(FormPageLayoutOnboard);
//# sourceMappingURL=FormPageLayout.js.map