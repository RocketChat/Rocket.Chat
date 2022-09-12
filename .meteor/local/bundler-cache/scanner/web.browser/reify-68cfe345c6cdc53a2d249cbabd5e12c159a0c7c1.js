let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,EmailInput,PasswordInput,Button,Box;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},EmailInput(v){EmailInput=v},PasswordInput(v){PasswordInput=v},Button(v){Button=v},Box(v){Box=v}},1);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},2);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},3);let ActionLink;module.link('../../common/ActionLink',{default(v){ActionLink=v}},4);let Form;module.link('../../common/Form',{default(v){Form=v}},5);let LoginActionsWrapper;module.link('./LoginForm.styles',{LoginActionsWrapper(v){LoginActionsWrapper=v}},6);var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};







var LoginForm = function (_a) {
    var onSubmit = _a.onSubmit, initialValues = _a.initialValues, _b = _a.isPasswordLess, isPasswordLess = _b === void 0 ? false : _b, onChangeForm = _a.onChangeForm, onResetPassword = _a.onResetPassword, formError = _a.formError;
    var t = useTranslation().t;
    var _c = useForm({
        defaultValues: __assign({}, initialValues),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, errors = _d.errors, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting;
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Subtitle, { children: !isPasswordLess
                    ? t('form.loginForm.content.default')
                    : t('form.loginForm.content.passwordLess') }, void 0), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.loginForm.fields.email.label') }, void 0), _jsx(Field.Row, { children: _jsx(EmailInput, __assign({}, register('email', {
                                        required: String(t('component.form.requiredField')),
                                    }), { placeholder: t('form.loginForm.fields.email.placeholder') }), void 0) }, void 0), errors.email && _jsx(Field.Error, { children: errors.email.message }, void 0)] }, void 0), !isPasswordLess && (_jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.loginForm.fields.password.label') }, void 0), _jsx(Field.Row, { children: _jsx(PasswordInput, __assign({}, register('password', { required: true }), { placeholder: t('form.loginForm.fields.password.placeholder') }), void 0) }, void 0), (formError || errors.password) && (_jsx(Field.Error, { children: t('form.loginForm.fields.password.error') }, void 0))] }, void 0))] }, void 0) }, void 0), _jsxs(Form.Footer, { children: [_jsxs(LoginActionsWrapper, { children: [_jsx(Button, __assign({ type: 'submit', disabled: isValidating || isSubmitting, primary: true }, { children: isPasswordLess
                                    ? t('form.loginForm.sendLoginLink')
                                    : t('form.loginForm.button.text') }), void 0), !isPasswordLess && (_jsx(ActionLink, __assign({ fontScale: 'p2', onClick: onChangeForm }, { children: t('form.loginForm.sendLoginLink') }), void 0)), isPasswordLess && (_jsx(ActionLink, __assign({ fontScale: 'p2', onClick: onChangeForm }, { children: t('form.loginForm.redirect') }), void 0))] }, void 0), !isPasswordLess && (_jsx(Box, __assign({ mbs: 'x24', fontScale: 'p2', textAlign: 'left' }, { children: _jsxs(Trans, __assign({ i18nKey: 'form.loginForm.resetPassword' }, { children: ["Forgot your password?", _jsx(ActionLink, __assign({ fontWeight: 400, fontScale: 'p2', onClick: onResetPassword }, { children: "Reset password" }), void 0)] }), void 0) }), void 0))] }, void 0)] }), void 0));
};
module.exportDefault(LoginForm);
//# sourceMappingURL=LoginForm.js.map