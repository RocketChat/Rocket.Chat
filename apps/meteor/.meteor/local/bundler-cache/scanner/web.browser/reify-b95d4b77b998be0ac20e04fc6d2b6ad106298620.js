module.export({useValidatePassword:()=>useValidatePassword},true);let useVerifyPassword;module.link('@rocket.chat/ui-contexts',{useVerifyPassword(v){useVerifyPassword=v}},0);let useMemo;module.link('react',{useMemo(v){useMemo=v}},1);

const useValidatePassword = (password) => {
    const passwordVerifications = useVerifyPassword(password);
    return useMemo(() => passwordVerifications.every(({ isValid }) => isValid), [passwordVerifications]);
};
//# sourceMappingURL=useValidatePassword.js.map