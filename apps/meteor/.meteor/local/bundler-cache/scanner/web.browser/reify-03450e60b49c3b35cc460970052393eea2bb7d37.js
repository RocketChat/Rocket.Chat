module.export({RegisterSecretPageRouter:()=>RegisterSecretPageRouter},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useDocumentTitle;module.link('@rocket.chat/ui-client',{useDocumentTitle(v){useDocumentTitle=v}},1);let useSetting;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let RegisterForm;module.link('./RegisterForm',{default(v){RegisterForm=v}},4);let RegisterFormDisabled;module.link('./RegisterFormDisabled',{default(v){RegisterFormDisabled=v}},5);let RegisterTemplate;module.link('./RegisterTemplate',{default(v){RegisterTemplate=v}},6);let SecretRegisterForm;module.link('./SecretRegisterForm',{default(v){SecretRegisterForm=v}},7);let SecretRegisterInvalidForm;module.link('./SecretRegisterInvalidForm',{default(v){SecretRegisterInvalidForm=v}},8);let FormSkeleton;module.link('./template/FormSkeleton',{default(v){FormSkeleton=v}},9);









const RegisterSecretPageRouter = ({ setLoginRoute, origin, }) => {
    const { t } = useTranslation();
    const registrationMode = useSetting('Accounts_RegistrationForm', 'Public');
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