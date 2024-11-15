module.export({LoginTerms:()=>LoginTerms},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let HorizontalWizardLayoutCaption;module.link('@rocket.chat/layout',{HorizontalWizardLayoutCaption(v){HorizontalWizardLayoutCaption=v}},2);let useSetting;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);




const LoginTerms = () => {
    const { t } = useTranslation();
    const loginTerms = useSetting('Layout_Login_Terms', '');
    return (_jsx(HorizontalWizardLayoutCaption, { children: _jsx(Box, { withRichContent: true, dangerouslySetInnerHTML: { __html: loginTerms !== '' ? loginTerms : t('Layout_Login_Terms_Content') } }) }));
};
module.exportDefault(LoginTerms);
//# sourceMappingURL=LoginTerms.js.map