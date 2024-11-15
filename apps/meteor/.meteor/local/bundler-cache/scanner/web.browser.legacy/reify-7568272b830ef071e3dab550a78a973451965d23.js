var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useRouteParameter;module.link('@rocket.chat/ui-contexts',{useRouteParameter:function(v){useRouteParameter=v}},1);var RegisterForm;module.link('./RegisterForm',{default:function(v){RegisterForm=v}},2);var SecretRegisterInvalidForm;module.link('./SecretRegisterInvalidForm',{default:function(v){SecretRegisterInvalidForm=v}},3);var useCheckRegistrationSecret;module.link('./hooks/useCheckRegistrationSecret',{useCheckRegistrationSecret:function(v){useCheckRegistrationSecret=v}},4);var FormSkeleton;module.link('./template/FormSkeleton',{default:function(v){FormSkeleton=v}},5);var HorizontalTemplate;module.link('./template/HorizontalTemplate',{default:function(v){HorizontalTemplate=v}},6);






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