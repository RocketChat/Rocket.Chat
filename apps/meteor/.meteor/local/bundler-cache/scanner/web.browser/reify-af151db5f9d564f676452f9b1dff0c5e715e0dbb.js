let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,EmailInput,ButtonGroup,Button,FieldLabel,FieldDescription,FieldRow,FieldError;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},EmailInput(v){EmailInput=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},FieldLabel(v){FieldLabel=v},FieldDescription(v){FieldDescription=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);var __assign = (this && this.__assign) || function () {
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





var ResetPasswordForm = function (_a) {
    var onSubmit = _a.onSubmit, validateEmail = _a.validateEmail, initialValues = _a.initialValues;
    var t = useTranslation().t;
    var _b = useForm({
        mode: 'onChange',
        defaultValues: __assign({}, initialValues),
    }), register = _b.register, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, isValid = _c.isValid, errors = _c.errors;
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Container, { children: _jsx(FieldGroup, { children: _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.resetPasswordForm.fields.email.label') }), _jsx(FieldDescription, { children: t('form.resetPasswordForm.content.subtitle') }), _jsx(FieldRow, { children: _jsx(EmailInput, __assign({}, register('email', {
                                    validate: validateEmail,
                                    required: true,
                                }), { placeholder: t('form.resetPasswordForm.fields.email.placeholder') })) }), errors.email && _jsx(FieldError, { children: errors.email.message })] }) }) }), _jsx(Form.Footer, { children: _jsx(ButtonGroup, { children: _jsx(Button, __assign({ type: 'submit', primary: true, loading: isValidating || isSubmitting, disabled: !isValid }, { children: t('form.resetPasswordForm.action.submit') })) }) })] })));
};
module.exportDefault(ResetPasswordForm);
//# sourceMappingURL=ResetPasswordForm.js.map