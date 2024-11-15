module.export({LoginTerms:function(){return LoginTerms}},true);var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var HorizontalWizardLayoutCaption;module.link('@rocket.chat/layout',{HorizontalWizardLayoutCaption:function(v){HorizontalWizardLayoutCaption=v}},2);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},3);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},4);




const LoginTerms = () => {
    const { t } = useTranslation();
    const loginTerms = useSetting('Layout_Login_Terms');
    return (_jsx(HorizontalWizardLayoutCaption, { children: _jsx(Box, { withRichContent: true, dangerouslySetInnerHTML: { __html: loginTerms !== '' ? loginTerms : t('Layout_Login_Terms_Content') } }) }));
};
module.exportDefault(LoginTerms);
//# sourceMappingURL=LoginTerms.js.map