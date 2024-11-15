var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},1);var VerticalTemplate;module.link('./template/VerticalTemplate',{default:function(v){VerticalTemplate=v}},2);


const SecretRegisterInvalidForm = () => {
    const { t } = useTranslation();
    return (_jsx(VerticalTemplate, { children: _jsx("h2", { children: t('Invalid_secret_URL_message') }) }));
};
module.exportDefault(SecretRegisterInvalidForm);
//# sourceMappingURL=SecretRegisterInvalidForm.js.map