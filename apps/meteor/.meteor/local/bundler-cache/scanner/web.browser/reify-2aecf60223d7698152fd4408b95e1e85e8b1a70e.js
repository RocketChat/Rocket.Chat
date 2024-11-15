let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,ButtonGroup,Button,Box,PasswordInput,TextInput,Throbber,FieldLabel,FieldRow,FieldError;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Box(v){Box=v},PasswordInput(v){PasswordInput=v},TextInput(v){TextInput=v},Throbber(v){Throbber=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);var __assign = (this && this.__assign) || function () {
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





var CreateFirstMemberForm = function (_a) {
    var _b;
    var defaultValues = _a.defaultValues, currentStep = _a.currentStep, stepCount = _a.stepCount, organizationName = _a.organizationName, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, validateUsername = _a.validateUsername, validatePassword = _a.validatePassword;
    var t = useTranslation().t;
    var _c = useForm({ mode: 'onChange' }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValid = _d.isValid, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, errors = _d.errors;
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }), _jsx(Form.Title, { children: t('form.createFirstMemberForm.title') }), _jsx(Form.Subtitle, { children: t('form.createFirstMemberForm.subtitle', { organizationName: organizationName }) }), _jsxs(FieldGroup, __assign({ mbs: 16 }, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: _jsx(Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createFirstMemberForm.fields.username.label') })) }), _jsx(FieldRow, { children: _jsx(TextInput, __assign({}, register('username', {
                                    validate: validateUsername,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.username, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.username) === null || _b === void 0 ? void 0 : _b.type) || undefined })) }), (errors === null || errors === void 0 ? void 0 : errors.username) && (_jsx(FieldError, { children: errors.username.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.createFirstMemberForm.fields.password.label') }), _jsx(FieldRow, { children: _jsx(PasswordInput, __assign({}, register('password', {
                                    validate: validatePassword,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.password })) }), errors.password && (_jsx(FieldError, { children: errors.password.message }))] })] })), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, { children: [_jsx(Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') })), _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid, minHeight: 'x40' }, { children: isSubmitting ? (_jsx(Throbber, { inheritColor: true })) : (t('form.createFirstMemberForm.button.submit')) }))] }) })] })));
};
module.exportDefault(CreateFirstMemberForm);
//# sourceMappingURL=CreateFirstMemberForm.js.map