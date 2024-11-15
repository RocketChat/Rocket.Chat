let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,PasswordInput,ButtonGroup,Button,FieldLabel,FieldRow,FieldError;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},PasswordInput(v){PasswordInput=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);var __assign = (this && this.__assign) || function () {
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





var CreateNewPassword = function (_a) {
    var onSubmit = _a.onSubmit, validatePassword = _a.validatePassword, validatePasswordConfirmation = _a.validatePasswordConfirmation, initialValues = _a.initialValues;
    var t = useTranslation().t;
    var _b = useForm({
        mode: 'onChange',
        defaultValues: __assign({}, initialValues),
    }), register = _b.register, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, isValid = _c.isValid, errors = _c.errors;
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.createPasswordForm.fields.password.label') }), _jsx(FieldRow, { children: _jsx(PasswordInput, __assign({}, register('password', {
                                        validate: validatePassword,
                                        required: true,
                                    }), { placeholder: t('form.createPasswordForm.fields.password.placeholder') })) }), errors.password && (_jsx(FieldError, { children: errors.password.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.createPasswordForm.fields.confirmPassword.label') }), _jsx(FieldRow, { children: _jsx(PasswordInput, __assign({}, register('passwordConfirmation', {
                                        validate: validatePasswordConfirmation,
                                        required: true,
                                    }), { placeholder: t('form.createPasswordForm.fields.confirmPassword.placeholder') })) }), errors.passwordConfirmation && (_jsx(FieldError, { children: errors.passwordConfirmation.message }))] })] }) }), _jsx(Form.Footer, { children: _jsx(ButtonGroup, __assign({ flexGrow: 1 }, { children: _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.createPasswordForm.button.text') })) })) })] })));
};
module.exportDefault(CreateNewPassword);
//# sourceMappingURL=CreateNewPassword.js.map