module.export({useLoginSendEmailConfirmation:function(){return useLoginSendEmailConfirmation}},true);var useMethod;module.link('@rocket.chat/ui-contexts',{useMethod:function(v){useMethod=v}},0);var useMutation;module.link('@tanstack/react-query',{useMutation:function(v){useMutation=v}},1);

const useLoginSendEmailConfirmation = () => {
    return useMutation({
        mutationFn: useMethod('sendConfirmationEmail'),
    });
};
//# sourceMappingURL=useLoginSendEmailConfirmation.js.map