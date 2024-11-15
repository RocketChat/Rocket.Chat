module.export({ResetPasswordForm:function(){return ResetPasswordForm}},true);var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var FieldGroup,TextInput,Field,FieldLabel,FieldRow,FieldError,ButtonGroup,Button,Callout;module.link('@rocket.chat/fuselage',{FieldGroup:function(v){FieldGroup=v},TextInput:function(v){TextInput=v},Field:function(v){Field=v},FieldLabel:function(v){FieldLabel=v},FieldRow:function(v){FieldRow=v},FieldError:function(v){FieldError=v},ButtonGroup:function(v){ButtonGroup=v},Button:function(v){Button=v},Callout:function(v){Callout=v}},1);var useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId:function(v){useUniqueId=v}},2);var Form,ActionLink;module.link('@rocket.chat/layout',{Form:function(v){Form=v},ActionLink:function(v){ActionLink=v}},3);var useDocumentTitle;module.link('@rocket.chat/ui-client',{useDocumentTitle:function(v){useDocumentTitle=v}},4);var useEffect,useRef;module.link('react',{useEffect:function(v){useEffect=v},useRef:function(v){useRef=v}},5);var useForm;module.link('react-hook-form',{useForm:function(v){useForm=v}},6);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},7);var useSendForgotPassword;module.link('./hooks/useSendForgotPassword',{useSendForgotPassword:function(v){useSendForgotPassword=v}},8);








const ResetPasswordForm = ({ setLoginRoute }) => {
    var _a;
    const { t } = useTranslation();
    const emailId = useUniqueId();
    const formLabelId = useUniqueId();
    const forgotPasswordFormRef = useRef(null);
    useDocumentTitle(t('registration.component.resetPassword'), false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({ mode: 'onBlur' });
    useEffect(() => {
        if (forgotPasswordFormRef.current) {
            forgotPasswordFormRef.current.focus();
        }
    }, []);
    const { mutateAsync, isSuccess } = useSendForgotPassword();
    return (_jsxs(Form, { ref: forgotPasswordFormRef, tabIndex: -1, "aria-labelledby": formLabelId, "aria-describedby": 'welcomeTitle', onSubmit: handleSubmit((data) => {
            mutateAsync({ email: data.email });
        }), children: [_jsx(Form.Header, { children: _jsx(Form.Title, { id: formLabelId, children: t('registration.component.resetPassword') }) }), _jsxs(Form.Container, { children: [_jsx(FieldGroup, { children: _jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: emailId, children: t('registration.component.form.email') }), _jsx(FieldRow, { children: _jsx(TextInput, Object.assign({}, register('email', {
                                        required: t('Required_field', { field: t('registration.component.form.email') }),
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: t('registration.page.resetPassword.errors.invalidEmail'),
                                        },
                                    }), { error: (_a = errors.email) === null || _a === void 0 ? void 0 : _a.message, "aria-invalid": Boolean(errors.email), "aria-required": 'true', "aria-describedby": `${emailId}-error`, placeholder: t('registration.component.form.emailPlaceholder'), id: emailId })) }), errors.email && (_jsx(FieldError, { "aria-live": 'assertive', id: `${emailId}-error`, children: errors.email.message }))] }) }), isSuccess && (_jsx(FieldGroup, { children: _jsx(Callout, { "aria-live": 'assertive', role: 'status', mbs: 24, icon: 'mail', children: t('registration.page.resetPassword.sent') }) }))] }), _jsxs(Form.Footer, { children: [_jsx(ButtonGroup, { children: _jsx(Button, { type: 'submit', loading: isSubmitting, primary: true, children: t('registration.page.resetPassword.sendInstructions') }) }), _jsx(ActionLink, { onClick: () => {
                            setLoginRoute('login');
                        }, children: t('registration.page.register.back') })] })] }));
};
module.exportDefault(ResetPasswordForm);
//# sourceMappingURL=ResetPasswordForm.js.map