module.export({EmailConfirmationForm:()=>EmailConfirmationForm},true);let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,TextInput,Field,FieldLabel,FieldRow,FieldError,ButtonGroup,Button,Callout;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},TextInput(v){TextInput=v},Field(v){Field=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Callout(v){Callout=v}},1);let Form,ActionLink;module.link('@rocket.chat/layout',{Form(v){Form=v},ActionLink(v){ActionLink=v}},2);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);let useLoginSendEmailConfirmation;module.link('./hooks/useLoginSendEmailConfirmation',{useLoginSendEmailConfirmation(v){useLoginSendEmailConfirmation=v}},5);





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