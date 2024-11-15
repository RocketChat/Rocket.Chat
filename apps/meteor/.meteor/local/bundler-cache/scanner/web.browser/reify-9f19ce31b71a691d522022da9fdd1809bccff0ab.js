let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let VerticalWizardLayout,VerticalWizardLayoutTitle,VerticalWizardLayoutFooter;module.link('@rocket.chat/layout',{VerticalWizardLayout(v){VerticalWizardLayout=v},VerticalWizardLayoutTitle(v){VerticalWizardLayoutTitle=v},VerticalWizardLayoutFooter(v){VerticalWizardLayoutFooter=v}},2);let useSetting,useAssetWithDarkModePath;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v},useAssetWithDarkModePath(v){useAssetWithDarkModePath=v}},3);let LoginPoweredBy;module.link('../components/LoginPoweredBy',{default(v){LoginPoweredBy=v}},4);let LoginSwitchLanguageFooter;module.link('../components/LoginSwitchLanguageFooter',{default(v){LoginSwitchLanguageFooter=v}},5);let LoginTerms;module.link('../components/LoginTerms',{default(v){LoginTerms=v}},6);let RegisterTitle;module.link('../components/RegisterTitle',{RegisterTitle(v){RegisterTitle=v}},7);







const VerticalTemplate = ({ children }) => {
    const hideLogo = useSetting('Layout_Login_Hide_Logo');
    const customLogo = useAssetWithDarkModePath('logo');
    const customBackground = useAssetWithDarkModePath('background');
    return (_jsxs(VerticalWizardLayout, { background: customBackground, logo: !hideLogo && customLogo ? _jsx(Box, { is: 'img', maxHeight: 'x40', mi: 'neg-x8', src: customLogo, alt: 'Logo' }) : _jsx(_Fragment, {}), children: [_jsx(VerticalWizardLayoutTitle, { children: _jsx(RegisterTitle, {}) }), _jsx(LoginPoweredBy, {}), children, _jsxs(VerticalWizardLayoutFooter, { children: [_jsx(LoginTerms, {}), _jsx(LoginSwitchLanguageFooter, {})] })] }));
};
module.exportDefault(VerticalTemplate);
//# sourceMappingURL=VerticalTemplate.js.map