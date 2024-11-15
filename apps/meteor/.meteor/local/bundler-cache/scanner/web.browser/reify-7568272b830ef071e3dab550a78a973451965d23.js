let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useRouteParameter;module.link('@rocket.chat/ui-contexts',{useRouteParameter(v){useRouteParameter=v}},1);let RegisterForm;module.link('./RegisterForm',{default(v){RegisterForm=v}},2);let SecretRegisterInvalidForm;module.link('./SecretRegisterInvalidForm',{default(v){SecretRegisterInvalidForm=v}},3);let useCheckRegistrationSecret;module.link('./hooks/useCheckRegistrationSecret',{useCheckRegistrationSecret(v){useCheckRegistrationSecret=v}},4);let FormSkeleton;module.link('./template/FormSkeleton',{default(v){FormSkeleton=v}},5);let HorizontalTemplate;module.link('./template/HorizontalTemplate',{default(v){HorizontalTemplate=v}},6);






const SecretRegisterForm = ({ setLoginRoute }) => {
    const hash = useRouteParameter('hash');
    const { data: valid, isSuccess } = useCheckRegistrationSecret(hash);
    if (isSuccess && !valid) {
        return _jsx(SecretRegisterInvalidForm, {});
    }
    if (isSuccess && valid) {
        return (_jsx(HorizontalTemplate, { children: _jsx(RegisterForm, { setLoginRoute: setLoginRoute }) }));
    }
    return (_jsx(HorizontalTemplate, { children: _jsx(FormSkeleton, {}) }));
};
module.exportDefault(SecretRegisterForm);
//# sourceMappingURL=SecretRegisterForm.js.map