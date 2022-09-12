let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,ButtonGroup,Button,Box,PasswordInput,TextInput;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Box(v){Box=v},PasswordInput(v){PasswordInput=v},TextInput(v){TextInput=v}},1);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let Form;module.link('../../common/Form',{default(v){Form=v}},4);var __assign = (this && this.__assign) || function () {
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
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), _jsx(Form.Title, { children: t('form.createFirstMemberForm.title') }, void 0), _jsx(Form.Subtitle, { children: t('form.createFirstMemberForm.subtitle', { organizationName: organizationName }) }, void 0), _jsxs(FieldGroup, __assign({ mbs: 'x16' }, { children: [_jsxs(Field, { children: [_jsx(Field.Label, { children: _jsx(Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createFirstMemberForm.fields.username.label') }), void 0) }, void 0), _jsx(Field.Row, { children: _jsx(TextInput, __assign({}, register('username', {
                                    validate: validateUsername,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.username, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.username) === null || _b === void 0 ? void 0 : _b.type) || undefined }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.username) && (_jsx(Field.Error, { children: errors.username.message }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.createFirstMemberForm.fields.password.label') }, void 0), _jsx(Field.Row, { children: _jsx(PasswordInput, __assign({}, register('password', {
                                    validate: validatePassword,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.password }), void 0) }, void 0), errors.password && (_jsx(Field.Error, { children: errors.password.message }, void 0))] }, void 0)] }), void 0), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, { children: [_jsx(Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0), _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.createFirstMemberForm.button.submit') }), void 0)] }, void 0) }, void 0)] }), void 0));
};
module.exportDefault(CreateFirstMemberForm);
//# sourceMappingURL=CreateFirstMemberForm.js.map