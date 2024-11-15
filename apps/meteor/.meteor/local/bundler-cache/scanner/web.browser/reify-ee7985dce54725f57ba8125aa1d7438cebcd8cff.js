let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let EmailInput,FieldGroup,Field,ButtonGroup,Button,PasswordInput,TextInput,Box,CheckBox,FieldLabel,FieldRow,FieldError,FieldHint;module.link('@rocket.chat/fuselage',{EmailInput(v){EmailInput=v},FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},PasswordInput(v){PasswordInput=v},TextInput(v){TextInput=v},Box(v){Box=v},CheckBox(v){CheckBox=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v},FieldHint(v){FieldHint=v}},1);let useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v}},2);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},3);let useRef,useEffect;module.link('react',{useRef(v){useRef=v},useEffect(v){useEffect=v}},4);let useForm,Controller;module.link('react-hook-form',{useForm(v){useForm=v},Controller(v){Controller=v}},5);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},6);var __assign = (this && this.__assign) || function () {
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
    var formId = useUniqueId();
    var fullnameField = useUniqueId();
    var usernameField = useUniqueId(); // lgtm [js/insecure-randomness]
    var emailField = useUniqueId();
    var passwordField = useUniqueId(); // lgtm [js/insecure-randomness]
    var adminInfoFormRef = useRef(null);
    var _c = useForm({
        defaultValues: __assign(__assign({}, initialValues), { password: '' }),
        mode: 'onBlur',
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, errors = _d.errors, control = _c.control;
    useEffect(function () {
        if (adminInfoFormRef.current) {
            adminInfoFormRef.current.focus();
        }
    }, []);
    return (_jsxs(Form, __assign({ ref: adminInfoFormRef, tabIndex: -1, "aria-labelledby": "".concat(formId, "-title"), "aria-describedby": "".concat(formId, "-description"), onSubmit: handleSubmit(onSubmit) }, { children: [_jsxs(Form.Header, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }), _jsx(Form.Title, __assign({ id: "".concat(formId, "-title") }, { children: t('form.adminInfoForm.title') })), _jsx(Form.Subtitle, __assign({ id: "".concat(formId, "-description") }, { children: t('form.adminInfoForm.subtitle') }))] }), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: fullnameField }, { children: t('form.adminInfoForm.fields.fullName.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'fullname', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(TextInput, __assign({}, field, { "aria-describedby": "".concat(fullnameField, "-error}"), "aria-required": 'true', "aria-invalid": Boolean(errors.fullname), placeholder: t('form.adminInfoForm.fields.fullName.placeholder'), id: fullnameField })));
                                        } }) }), errors.fullname && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(fullnameField, "-error}") }, { children: errors.fullname.message })))] }), _jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: usernameField }, { children: t('form.adminInfoForm.fields.username.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'username', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                            validate: validateUsername,
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(TextInput, __assign({}, field, { "aria-describedby": "".concat(usernameField, "-error}"), "aria-required": 'true', "aria-invalid": Boolean(errors.username), placeholder: t('form.adminInfoForm.fields.username.placeholder'), id: usernameField })));
                                        } }) }), errors.username && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(usernameField, "-error}") }, { children: errors.username.message })))] }), _jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: emailField }, { children: t('form.adminInfoForm.fields.email.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'email', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                            validate: validateEmail,
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(EmailInput, __assign({}, field, { "aria-required": 'true', "aria-invalid": Boolean(errors.email), "aria-describedby": "".concat(emailField, "-error}"), placeholder: t('form.adminInfoForm.fields.email.placeholder'), id: emailField })));
                                        } }) }), errors.email && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(emailField, "-error}") }, { children: errors.email.message })))] }), _jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: passwordField }, { children: t('form.adminInfoForm.fields.password.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'password', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                            validate: validatePassword,
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(PasswordInput, __assign({}, field, { "aria-required": 'true', "aria-invalid": Boolean(errors.password), "aria-describedby": "".concat(passwordField, "-hint ").concat(passwordField, "-error}"), placeholder: t('form.adminInfoForm.fields.password.placeholder'), id: passwordField })));
                                        } }) }), _jsx(FieldHint, __assign({ id: "".concat(passwordField, "-hint") }, { children: passwordRulesHint })), errors.password && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(passwordField, "-error}") }, { children: errors.password.message })))] }), keepPosted && (_jsxs(Box, __assign({ mbe: 8, display: 'block', color: 'info', fontScale: 'c1' }, { children: [_jsx(CheckBox, __assign({ id: 'keepPosted', mie: 8 }, register('keepPosted'))), _jsx("label", __assign({ htmlFor: 'keepPosted' }, { children: t('form.adminInfoForm.fields.keepPosted.label') }))] })))] }) }), _jsx(Form.Footer, { children: _jsx(ButtonGroup, { children: _jsx(Button, __assign({ type: 'submit', primary: true, loading: isValidating || isSubmitting }, { children: t('component.form.action.next') })) }) })] })));
};
module.exportDefault(AdminInfoForm);
//# sourceMappingURL=AdminInfoForm.js.map