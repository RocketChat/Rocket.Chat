module.export({useValidatePassword:function(){return useValidatePassword}},true);var useVerifyPassword;module.link('@rocket.chat/ui-contexts',{useVerifyPassword:function(v){useVerifyPassword=v}},0);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},1);

const useValidatePassword = (password) => {
    const passwordVerifications = useVerifyPassword(password);
    return useMemo(() => passwordVerifications.every(({ isValid }) => isValid), [passwordVerifications]);
};
//# sourceMappingURL=useValidatePassword.js.map