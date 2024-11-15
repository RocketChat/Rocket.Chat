module.export({useSendForgotPassword:()=>useSendForgotPassword},true);let useEndpoint;module.link('@rocket.chat/ui-contexts',{useEndpoint(v){useEndpoint=v}},0);let useMutation;module.link('@tanstack/react-query',{useMutation(v){useMutation=v}},1);

const useSendForgotPassword = () => {
    const sendForgotPassword = useEndpoint('POST', '/v1/users.forgotPassword');
    return useMutation({
        mutationFn: sendForgotPassword,
    });
};
//# sourceMappingURL=useSendForgotPassword.js.map