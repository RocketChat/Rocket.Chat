let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,IconButton;module.link('@rocket.chat/fuselage',{Box(v){Box=v},IconButton(v){IconButton=v}},1);let VerticalWizardLayout,VerticalWizardLayoutFooter,VerticalWizardLayoutForm,VerticalWizardLayoutTitle;module.link('@rocket.chat/layout',{VerticalWizardLayout(v){VerticalWizardLayout=v},VerticalWizardLayoutFooter(v){VerticalWizardLayoutFooter=v},VerticalWizardLayoutForm(v){VerticalWizardLayoutForm=v},VerticalWizardLayoutTitle(v){VerticalWizardLayoutTitle=v}},2);let useSetting,useTranslation,useAssetWithDarkModePath;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v},useTranslation(v){useTranslation=v},useAssetWithDarkModePath(v){useAssetWithDarkModePath=v}},3);let LoginPoweredBy;module.link('./components/LoginPoweredBy',{LoginPoweredBy(v){LoginPoweredBy=v}},4);




const CMSPage = ({ page }) => {
    const t = useTranslation();
    const pageContent = useSetting(page, '');
    const customLogo = useAssetWithDarkModePath('logo');
    const customBackground = useAssetWithDarkModePath('background');
    return (_jsxs(VerticalWizardLayout, { background: customBackground, logo: customLogo ? _jsx(Box, { is: 'img', maxHeight: 'x40', mi: 'neg-x8', src: customLogo, alt: 'Logo' }) : undefined, children: [_jsx(VerticalWizardLayoutTitle, { children: t(page) }), _jsx(VerticalWizardLayoutForm, { children: _jsxs(Box, { p: 32, children: [_jsx(IconButton, { title: t('Back'), icon: 'arrow-back', onClick: () => window.history.back(), style: { float: 'right' } }), _jsx(Box, { withRichContent: true, dangerouslySetInnerHTML: { __html: pageContent } })] }) }), _jsx(VerticalWizardLayoutFooter, { children: _jsx(LoginPoweredBy, {}) })] }));
};
module.exportDefault(CMSPage);
//# sourceMappingURL=CMSPage.js.map