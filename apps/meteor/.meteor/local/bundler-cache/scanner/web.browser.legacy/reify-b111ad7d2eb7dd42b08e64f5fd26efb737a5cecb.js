module.export({RegisterSecretPageRouter:function(){return RegisterSecretPageRouter}},true);var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useDocumentTitle;module.link('@rocket.chat/ui-client',{useDocumentTitle:function(v){useDocumentTitle=v}},1);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var RegisterForm;module.link('./RegisterForm',{default:function(v){RegisterForm=v}},4);var RegisterFormDisabled;module.link('./RegisterFormDisabled',{default:function(v){RegisterFormDisabled=v}},5);var RegisterTemplate;module.link('./RegisterTemplate',{default:function(v){RegisterTemplate=v}},6);var SecretRegisterForm;module.link('./SecretRegisterForm',{default:function(v){SecretRegisterForm=v}},7);var SecretRegisterInvalidForm;module.link('./SecretRegisterInvalidForm',{default:function(v){SecretRegisterInvalidForm=v}},8);var FormSkeleton;module.link('./template/FormSkeleton',{default:function(v){FormSkeleton=v}},9);









const RegisterSecretPageRouter = ({ setLoginRoute, origin, }) => {
    const { t } = useTranslation();
    const registrationMode = useSetting('Accounts_RegistrationForm');
    const isPublicRegistration = registrationMode === 'Public';
    const isRegistrationAllowedForSecret = registrationMode === 'Secret URL';
    const isRegistrationDisabled = registrationMode === 'Disabled' || (origin === 'register' && isRegistrationAllowedForSecret);
    useDocumentTitle(t('registration.component.form.createAnAccount'), false);
    if (origin === 'secret-register' && !isRegistrationAllowedForSecret) {
        return _jsx(SecretRegisterInvalidForm, {});
    }
    if (isPublicRegistration || (origin === 'invite-register' && isRegistrationAllowedForSecret)) {
        return (_jsx(RegisterTemplate, { children: _jsx(RegisterForm, { setLoginRoute: setLoginRoute }) }));
    }
    if (isRegistrationDisabled) {
        return (_jsx(RegisterTemplate, { children: _jsx(RegisterFormDisabled, { setLoginRoute: setLoginRoute }) }));
    }
    if (isRegistrationAllowedForSecret) {
        return _jsx(SecretRegisterForm, { setLoginRoute: setLoginRoute });
    }
    return (_jsx(RegisterTemplate, { children: _jsx(FormSkeleton, {}) }));
};
module.exportDefault(RegisterSecretPageRouter);
//# sourceMappingURL=RegisterSecretPageRouter.js.map