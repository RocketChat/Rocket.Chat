let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},1);let VerticalTemplate;module.link('./template/VerticalTemplate',{default(v){VerticalTemplate=v}},2);


const SecretRegisterInvalidForm = () => {
    const { t } = useTranslation();
    return (_jsx(VerticalTemplate, { children: _jsx("h2", { children: t('Invalid_secret_URL_message') }) }));
};
module.exportDefault(SecretRegisterInvalidForm);
//# sourceMappingURL=SecretRegisterInvalidForm.js.map