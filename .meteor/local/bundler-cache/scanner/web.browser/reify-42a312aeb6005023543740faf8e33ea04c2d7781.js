let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let EmailInput,FieldGroup,Field,ButtonGroup,Button,PasswordInput,TextInput,Box,CheckBox;module.link('@rocket.chat/fuselage',{EmailInput(v){EmailInput=v},FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},PasswordInput(v){PasswordInput=v},TextInput(v){TextInput=v},Box(v){Box=v},CheckBox(v){CheckBox=v}},1);let useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v}},2);let useEffect;module.link('react',{useEffect(v){useEffect=v}},3);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},4);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},5);let Form;module.link('../../common/Form',{default(v){Form=v}},6);var __assign = (this && this.__assign) || function () {
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







var AdminInfoForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, passwordRulesHint = _a.passwordRulesHint, initialValues = _a.initialValues, validateUsername = _a.validateUsername, validateEmail = _a.validateEmail, validatePassword = _a.validatePassword, _b = _a.keepPosted, keepPosted = _b === void 0 ? false : _b, onSubmit = _a.onSubmit;
    var t = useTranslation().t;
    var fullnameField = useUniqueId();
    var usernameField = useUniqueId(); // lgtm [js/insecure-randomness]
    var emailField = useUniqueId();
    var passwordField = useUniqueId(); // lgtm [js/insecure-randomness]
    var _c = useForm({
        defaultValues: __assign(__assign({}, initialValues), { password: '' }),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, errors = _d.errors, setFocus = _c.setFocus;
    useEffect(function () {
        setFocus('fullname');
    }, [setFocus]);
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), _jsx(Form.Title, { children: t('form.adminInfoForm.title') }, void 0), _jsx(Form.Subtitle, { children: t('form.adminInfoForm.subtitle') }, void 0), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: fullnameField }, { children: t('form.adminInfoForm.fields.fullName.label') }), void 0), _jsx(Field.Row, { children: _jsx(TextInput, __assign({}, register('fullname', {
                                        required: String(t('component.form.requiredField')),
                                    }), { placeholder: t('form.adminInfoForm.fields.fullName.placeholder'), id: fullnameField }), void 0) }, void 0), errors.fullname && (_jsx(Field.Error, { children: errors.fullname.message }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: usernameField }, { children: t('form.adminInfoForm.fields.username.label') }), void 0), _jsx(Field.Row, { children: _jsx(TextInput, __assign({}, register('username', {
                                        required: String(t('component.form.requiredField')),
                                        validate: validateUsername,
                                    }), { placeholder: t('form.adminInfoForm.fields.username.placeholder'), id: usernameField }), void 0) }, void 0), errors.username && (_jsx(Field.Error, { children: errors.username.message }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: emailField }, { children: t('form.adminInfoForm.fields.email.label') }), void 0), _jsx(Field.Row, { children: _jsx(EmailInput, __assign({}, register('email', {
                                        required: String(t('component.form.requiredField')),
                                        validate: validateEmail,
                                    }), { placeholder: t('form.adminInfoForm.fields.email.placeholder'), id: emailField }), void 0) }, void 0), errors.email && _jsx(Field.Error, { children: errors.email.message }, void 0)] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: passwordField }, { children: t('form.adminInfoForm.fields.password.label') }), void 0), _jsx(Field.Row, { children: _jsx(PasswordInput, __assign({}, register('password', {
                                        required: String(t('component.form.requiredField')),
                                        validate: validatePassword,
                                    }), { placeholder: t('form.adminInfoForm.fields.password.placeholder'), id: passwordField }), void 0) }, void 0), _jsx(Field.Hint, { children: passwordRulesHint }, void 0), errors.password && (_jsx(Field.Error, { children: errors.password.message }, void 0))] }, void 0), keepPosted && (_jsxs(Box, __assign({ mbe: 'x8', display: 'block', color: 'info', fontScale: 'c1' }, { children: [_jsx(CheckBox, __assign({ id: 'keepPosted', mie: 'x8' }, register('keepPosted')), void 0), _jsx("label", __assign({ htmlFor: 'keepPosted' }, { children: t('form.adminInfoForm.fields.keepPosted.label') }), void 0)] }), void 0))] }, void 0) }, void 0), _jsx(Form.Footer, { children: _jsx(ButtonGroup, __assign({ flexGrow: 1 }, { children: _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting }, { children: t('component.form.action.next') }), void 0) }), void 0) }, void 0)] }), void 0));
};
module.exportDefault(AdminInfoForm);
//# sourceMappingURL=AdminInfoForm.js.map