module.export({EmailConfirmationForm:function(){return EmailConfirmationForm}},true);var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var FieldGroup,TextInput,Field,FieldLabel,FieldRow,FieldError,ButtonGroup,Button,Callout;module.link('@rocket.chat/fuselage',{FieldGroup:function(v){FieldGroup=v},TextInput:function(v){TextInput=v},Field:function(v){Field=v},FieldLabel:function(v){FieldLabel=v},FieldRow:function(v){FieldRow=v},FieldError:function(v){FieldError=v},ButtonGroup:function(v){ButtonGroup=v},Button:function(v){Button=v},Callout:function(v){Callout=v}},1);var Form,ActionLink;module.link('@rocket.chat/layout',{Form:function(v){Form=v},ActionLink:function(v){ActionLink=v}},2);var useForm;module.link('react-hook-form',{useForm:function(v){useForm=v}},3);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},4);var useLoginSendEmailConfirmation;module.link('./hooks/useLoginSendEmailConfirmation',{useLoginSendEmailConfirmation:function(v){useLoginSendEmailConfirmation=v}},5);





const EmailConfirmationForm = ({ email, onBackToLogin }) => {
    var _a;
    const { t } = useTranslation();
    const basicEmailRegex = /^[^@]+@[^@]+$/;
    const isEmail = basicEmailRegex.test(email || '');
    const { register, handleSubmit, formState: { errors }, } = useForm({
        defaultValues: {
            email: isEmail ? email : '',
        },
    });
    const sendEmail = useLoginSendEmailConfirmation();
    return (_jsxs(Form, { onSubmit: handleSubmit((data) => {
            if (sendEmail.isLoading) {
                return;
            }
            sendEmail.mutate(data.email);
        }), children: [_jsxs(Form.Header, { children: [_jsx(Form.Title, { children: t('registration.component.form.confirmation') }), _jsx(Form.Subtitle, { children: t('registration.page.emailVerification.subTitle') })] }), _jsxs(Form.Container, { children: [_jsx(FieldGroup, { disabled: sendEmail.isLoading || sendEmail.isSuccess, children: _jsxs(Field, { children: [_jsxs(FieldLabel, { htmlFor: 'email', children: [t('registration.component.form.email'), "*"] }), _jsx(FieldRow, { children: _jsx(TextInput, Object.assign({}, register('email', {
                                        required: true,
                                    }), { error: errors.email && t('registration.component.form.requiredField'), "aria-invalid": ((_a = errors === null || errors === void 0 ? void 0 : errors.email) === null || _a === void 0 ? void 0 : _a.type) === 'required', placeholder: t('registration.component.form.emailPlaceholder'), id: 'email' })) }), errors.email && _jsx(FieldError, { children: t('registration.component.form.requiredField') })] }) }), sendEmail.isSuccess && (_jsx(FieldGroup, { children: _jsx(Callout, { type: 'success', children: t('registration.page.emailVerification.sent') }) }))] }), _jsxs(Form.Footer, { children: [_jsx(ButtonGroup, { children: _jsx(Button, { loading: sendEmail.isLoading, type: 'submit', primary: true, children: t('registration.component.form.sendConfirmationEmail') }) }), _jsx(ActionLink, { onClick: () => {
                            onBackToLogin();
                        }, children: t('registration.page.register.back') })] })] }));
};
module.exportDefault(EmailConfirmationForm);
//# sourceMappingURL=EmailConfirmationForm.js.map