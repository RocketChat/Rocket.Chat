var _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v},Fragment:function(v){_Fragment=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var VerticalWizardLayout,VerticalWizardLayoutTitle,VerticalWizardLayoutFooter;module.link('@rocket.chat/layout',{VerticalWizardLayout:function(v){VerticalWizardLayout=v},VerticalWizardLayoutTitle:function(v){VerticalWizardLayoutTitle=v},VerticalWizardLayoutFooter:function(v){VerticalWizardLayoutFooter=v}},2);var useSetting,useAssetWithDarkModePath;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v},useAssetWithDarkModePath:function(v){useAssetWithDarkModePath=v}},3);var LoginPoweredBy;module.link('../components/LoginPoweredBy',{default:function(v){LoginPoweredBy=v}},4);var LoginSwitchLanguageFooter;module.link('../components/LoginSwitchLanguageFooter',{default:function(v){LoginSwitchLanguageFooter=v}},5);var LoginTerms;module.link('../components/LoginTerms',{default:function(v){LoginTerms=v}},6);var RegisterTitle;module.link('../components/RegisterTitle',{RegisterTitle:function(v){RegisterTitle=v}},7);







const VerticalTemplate = ({ children }) => {
    const hideLogo = useSetting('Layout_Login_Hide_Logo');
    const customLogo = useAssetWithDarkModePath('logo');
    const customBackground = useAssetWithDarkModePath('background');
    return (_jsxs(VerticalWizardLayout, { background: customBackground, logo: !hideLogo && customLogo ? _jsx(Box, { is: 'img', maxHeight: 'x40', mi: 'neg-x8', src: customLogo, alt: 'Logo' }) : _jsx(_Fragment, {}), children: [_jsx(VerticalWizardLayoutTitle, { children: _jsx(RegisterTitle, {}) }), _jsx(LoginPoweredBy, {}), children, _jsxs(VerticalWizardLayoutFooter, { children: [_jsx(LoginTerms, {}), _jsx(LoginSwitchLanguageFooter, {})] })] }));
};
module.exportDefault(VerticalTemplate);
//# sourceMappingURL=VerticalTemplate.js.map