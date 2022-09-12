let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let EmailInput,FieldGroup,Field,ButtonGroup,Button,PasswordInput,TextInput,Box,CheckBox;module.link('@rocket.chat/fuselage',{EmailInput(v){EmailInput=v},FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},PasswordInput(v){PasswordInput=v},TextInput(v){TextInput=v},Box(v){Box=v},CheckBox(v){CheckBox=v}},1);let useEffect;module.link('react',{useEffect(v){useEffect=v}},2);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},3);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},4);let Form;module.link('../../common/Form',{default(v){Form=v}},5);var __assign = (this && this.__assign) || function () {
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
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.newAccountForm.fields.name.label') }, void 0), _jsx(Field.Row, { children: _jsx(TextInput, __assign({}, register('name', {
                                        required: String(t('component.form.requiredField')),
                                    })), void 0) }, void 0), errors.name && _jsx(Field.Error, { children: errors.name.message }, void 0)] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.newAccountForm.fields.email.label') }, void 0), _jsx(Field.Row, { children: _jsx(EmailInput, __assign({}, register('email', {
                                        validate: validateEmail,
                                        required: true,
                                    })), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.email) && _jsx(Field.Error, { children: errors.email.message }, void 0)] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.newAccountForm.fields.password.label') }, void 0), _jsx(Field.Row, { children: _jsx(PasswordInput, __assign({}, register('password', {
                                        required: true,
                                        validate: validatePassword,
                                    })), void 0) }, void 0), errors.password && (_jsx(Field.Error, { children: errors.password.message }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.newAccountForm.fields.confirmPassword.label') }, void 0), _jsx(Field.Row, { children: _jsx(PasswordInput, __assign({}, register('confirmPassword', {
                                        required: true,
                                        validate: validateConfirmationPassword,
                                    })), void 0) }, void 0), errors.confirmPassword && (_jsx(Field.Error, { children: errors.confirmPassword.message }, void 0))] }, void 0), _jsxs(Field, { children: [_jsxs(Field.Row, __assign({ justifyContent: 'flex-start' }, { children: [_jsx(CheckBox, __assign({}, register('agreement', { required: true }), { mie: 'x8' }), void 0), _jsx(Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", _jsx("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" }), void 0), "and", _jsx("a", __assign({ href: 'https://rocket.chat/policy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Polic" }), void 0)] }), void 0) }), void 0)] }), void 0), ((_b = errors.agreement) === null || _b === void 0 ? void 0 : _b.type) === 'required' && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0)] }, void 0) }, void 0), _jsx(Form.Footer, { children: _jsx(ButtonGroup, __assign({ flexGrow: 1 }, { children: _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.next') }), void 0) }), void 0) }, void 0)] }), void 0));
};
module.exportDefault(NewAccountForm);
//# sourceMappingURL=NewAccountForm.js.map