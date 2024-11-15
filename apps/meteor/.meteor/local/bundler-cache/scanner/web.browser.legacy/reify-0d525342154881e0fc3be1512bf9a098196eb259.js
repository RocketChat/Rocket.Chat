module.export({useSendForgotPassword:function(){return useSendForgotPassword}},true);var useEndpoint;module.link('@rocket.chat/ui-contexts',{useEndpoint:function(v){useEndpoint=v}},0);var useMutation;module.link('@tanstack/react-query',{useMutation:function(v){useMutation=v}},1);

const useSendForgotPassword = () => {
    const sendForgotPassword = useEndpoint('POST', '/v1/users.forgotPassword');
    return useMutation({
        mutationFn: sendForgotPassword,
    });
};
//# sourceMappingURL=useSendForgotPassword.js.map