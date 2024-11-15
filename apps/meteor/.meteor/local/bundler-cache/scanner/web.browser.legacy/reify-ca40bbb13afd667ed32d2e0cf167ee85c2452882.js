var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box,IconButton;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},IconButton:function(v){IconButton=v}},1);var VerticalWizardLayout,VerticalWizardLayoutFooter,VerticalWizardLayoutForm,VerticalWizardLayoutTitle;module.link('@rocket.chat/layout',{VerticalWizardLayout:function(v){VerticalWizardLayout=v},VerticalWizardLayoutFooter:function(v){VerticalWizardLayoutFooter=v},VerticalWizardLayoutForm:function(v){VerticalWizardLayoutForm=v},VerticalWizardLayoutTitle:function(v){VerticalWizardLayoutTitle=v}},2);var useSetting,useTranslation,useAssetWithDarkModePath;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v},useTranslation:function(v){useTranslation=v},useAssetWithDarkModePath:function(v){useAssetWithDarkModePath=v}},3);var LoginPoweredBy;module.link('./components/LoginPoweredBy',{LoginPoweredBy:function(v){LoginPoweredBy=v}},4);




const CMSPage = ({ page }) => {
    const t = useTranslation();
    const pageContent = useSetting(page);
    const customLogo = useAssetWithDarkModePath('logo');
    const customBackground = useAssetWithDarkModePath('background');
    return (_jsxs(VerticalWizardLayout, { background: customBackground, logo: customLogo ? _jsx(Box, { is: 'img', maxHeight: 'x40', mi: 'neg-x8', src: customLogo, alt: 'Logo' }) : undefined, children: [_jsx(VerticalWizardLayoutTitle, { children: t(page) }), _jsx(VerticalWizardLayoutForm, { children: _jsxs(Box, { p: 32, children: [_jsx(IconButton, { title: t('Back'), icon: 'arrow-back', onClick: () => window.history.back(), style: { float: 'right' } }), _jsx(Box, { withRichContent: true, dangerouslySetInnerHTML: { __html: pageContent } })] }) }), _jsx(VerticalWizardLayoutFooter, { children: _jsx(LoginPoweredBy, {}) })] }));
};
module.exportDefault(CMSPage);
//# sourceMappingURL=CMSPage.js.map