module.export({useLoginSendEmailConfirmation:()=>useLoginSendEmailConfirmation},true);let useMethod;module.link('@rocket.chat/ui-contexts',{useMethod(v){useMethod=v}},0);let useMutation;module.link('@tanstack/react-query',{useMutation(v){useMutation=v}},1);

const useLoginSendEmailConfirmation = () => {
    return useMutation({
        mutationFn: useMethod('sendConfirmationEmail'),
    });
};
//# sourceMappingURL=useLoginSendEmailConfirmation.js.map