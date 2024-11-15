let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let EmailInput,FieldGroup,Field,ButtonGroup,Button,PasswordInput,TextInput,Box,CheckBox,FieldLabel,FieldRow,FieldError;module.link('@rocket.chat/fuselage',{EmailInput(v){EmailInput=v},FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},PasswordInput(v){PasswordInput=v},TextInput(v){TextInput=v},Box(v){Box=v},CheckBox(v){CheckBox=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);let useEffect;module.link('react',{useEffect(v){useEffect=v}},3);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},4);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},5);var __assign = (this && this.__assign) || function () {
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






var NewAccountForm = function (_a) {
    var _b;
    var validateEmail = _a.validateEmail, validatePassword = _a.validatePassword, validateConfirmationPassword = _a.validateConfirmationPassword, onSubmit = _a.onSubmit;
    var t = useTranslation().t;
    var _c = useForm({ mode: 'onChange' }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, isValid = _d.isValid, errors = _d.errors, setFocus = _c.setFocus;
    useEffect(function () {
        setFocus('name');
    }, [setFocus]);
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.newAccountForm.fields.name.label') }), _jsx(FieldRow, { children: _jsx(TextInput, __assign({}, register('name', {
                                        required: String(t('component.form.requiredField')),
                                    }))) }), errors.name && _jsx(FieldError, { children: errors.name.message })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.newAccountForm.fields.email.label') }), _jsx(FieldRow, { children: _jsx(EmailInput, __assign({}, register('email', {
                                        validate: validateEmail,
                                        required: true,
                                    }))) }), (errors === null || errors === void 0 ? void 0 : errors.email) && _jsx(FieldError, { children: errors.email.message })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.newAccountForm.fields.password.label') }), _jsx(FieldRow, { children: _jsx(PasswordInput, __assign({}, register('password', {
                                        required: true,
                                        validate: validatePassword,
                                    }))) }), errors.password && (_jsx(FieldError, { children: errors.password.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.newAccountForm.fields.confirmPassword.label') }), _jsx(FieldRow, { children: _jsx(PasswordInput, __assign({}, register('confirmPassword', {
                                        required: true,
                                        validate: validateConfirmationPassword,
                                    }))) }), errors.confirmPassword && (_jsx(FieldError, { children: errors.confirmPassword.message }))] }), _jsxs(Field, { children: [_jsxs(FieldRow, __assign({ justifyContent: 'flex-start' }, { children: [_jsx(CheckBox, __assign({}, register('agreement', { required: true }), { mie: 8 })), _jsx(Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", _jsx("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", _jsx("a", __assign({ href: 'https://rocket.chat/privacy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] })), ((_b = errors.agreement) === null || _b === void 0 ? void 0 : _b.type) === 'required' && (_jsx(FieldError, { children: t('component.form.requiredField') }))] })] }) }), _jsx(Form.Footer, { children: _jsx(ButtonGroup, { children: _jsx(Button, __assign({ type: 'submit', primary: true, loading: isValidating || isSubmitting, disabled: !isValid }, { children: t('component.form.action.next') })) }) })] })));
};
module.exportDefault(NewAccountForm);
//# sourceMappingURL=NewAccountForm.js.map