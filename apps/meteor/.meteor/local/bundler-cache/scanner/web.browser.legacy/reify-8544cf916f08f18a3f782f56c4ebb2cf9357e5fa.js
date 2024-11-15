var _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v},Fragment:function(v){_Fragment=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var HorizontalWizardLayout,HorizontalWizardLayoutAside,HorizontalWizardLayoutContent,HorizontalWizardLayoutTitle,HorizontalWizardLayoutFooter;module.link('@rocket.chat/layout',{HorizontalWizardLayout:function(v){HorizontalWizardLayout=v},HorizontalWizardLayoutAside:function(v){HorizontalWizardLayoutAside=v},HorizontalWizardLayoutContent:function(v){HorizontalWizardLayoutContent=v},HorizontalWizardLayoutTitle:function(v){HorizontalWizardLayoutTitle=v},HorizontalWizardLayoutFooter:function(v){HorizontalWizardLayoutFooter=v}},2);var useSetting,useAssetWithDarkModePath;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v},useAssetWithDarkModePath:function(v){useAssetWithDarkModePath=v}},3);var LoginPoweredBy;module.link('../components/LoginPoweredBy',{default:function(v){LoginPoweredBy=v}},4);var LoginSwitchLanguageFooter;module.link('../components/LoginSwitchLanguageFooter',{default:function(v){LoginSwitchLanguageFooter=v}},5);var LoginTerms;module.link('../components/LoginTerms',{default:function(v){LoginTerms=v}},6);var RegisterTitle;module.link('../components/RegisterTitle',{RegisterTitle:function(v){RegisterTitle=v}},7);







const HorizontalTemplate = ({ children }) => {
    const hideLogo = useSetting('Layout_Login_Hide_Logo');
    const customLogo = useAssetWithDarkModePath('logo');
    const customBackground = useAssetWithDarkModePath('background');
    return (_jsxs(HorizontalWizardLayout, { background: customBackground, logo: !hideLogo && customLogo ? _jsx(Box, { is: 'img', maxHeight: 'x40', mi: 'neg-x8', src: customLogo, alt: 'Logo' }) : _jsx(_Fragment, {}), children: [_jsxs(HorizontalWizardLayoutAside, { children: [_jsx(HorizontalWizardLayoutTitle, { children: _jsx(RegisterTitle, {}) }), _jsx(LoginPoweredBy, {})] }), _jsxs(HorizontalWizardLayoutContent, { children: [children, _jsxs(HorizontalWizardLayoutFooter, { children: [_jsx(LoginTerms, {}), _jsx(LoginSwitchLanguageFooter, {})] })] })] }));
};
module.exportDefault(HorizontalTemplate);
//# sourceMappingURL=HorizontalTemplate.js.map