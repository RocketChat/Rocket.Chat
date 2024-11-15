let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldDescription,FieldError,FieldLabel,FieldRow,Button,Field,Box,CheckBox,FieldGroup,TextInput,EmailInput,Select,SelectFiltered;module.link('@rocket.chat/fuselage',{FieldDescription(v){FieldDescription=v},FieldError(v){FieldError=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},Button(v){Button=v},Field(v){Field=v},Box(v){Box=v},CheckBox(v){CheckBox=v},FieldGroup(v){FieldGroup=v},TextInput(v){TextInput=v},EmailInput(v){EmailInput=v},Select(v){Select=v},SelectFiltered(v){SelectFiltered=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);let useForm,Controller;module.link('react-hook-form',{useForm(v){useForm=v},Controller(v){Controller=v}},3);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},4);var __assign = (this && this.__assign) || function () {
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





var RequestTrialForm = function (_a) {
    var _b;
    var defaultValues = _a.defaultValues, organizationSizeOptions = _a.organizationSizeOptions, countryOptions = _a.countryOptions, onSubmit = _a.onSubmit, validateEmail = _a.validateEmail, _c = _a.termsHref, termsHref = _c === void 0 ? 'https://rocket.chat/terms' : _c, _d = _a.policyHref, policyHref = _d === void 0 ? 'https://rocket.chat/privacy' : _d;
    var t = useTranslation().t;
    var _e = useForm({ mode: 'onChange' }), handleSubmit = _e.handleSubmit, register = _e.register, control = _e.control, _f = _e.formState, isValidating = _f.isValidating, isSubmitting = _f.isSubmitting, isValid = _f.isValid, errors = _f.errors;
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.requestTrialForm.fields.emailAddress.label') }), _jsx(FieldRow, { children: _jsx(EmailInput, __assign({}, register('email', {
                                    validate: validateEmail,
                                    required: true,
                                }), { placeholder: t('form.requestTrialForm.fields.emailAddress.placeholder'), defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.email, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.email) === null || _b === void 0 ? void 0 : _b.message) || undefined })) }), (errors === null || errors === void 0 ? void 0 : errors.email) && _jsx(FieldError, { children: errors.email.message })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.requestTrialForm.fields.organizationName.label') }), _jsx(FieldRow, { children: _jsx(TextInput, __assign({}, register('organizationName', { required: true }), { placeholder: t('form.requestTrialForm.fields.organizationName.placeholder'), defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationName })) }), (errors === null || errors === void 0 ? void 0 : errors.organizationName) && (_jsx(FieldError, { children: t('component.form.requiredField') }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.requestTrialForm.fields.organizationSize.label') }), _jsx(FieldRow, { children: _jsx(Controller, { name: 'organizationSize', control: control, rules: { required: true }, render: function (_a) {
                                        var _b;
                                        var field = _a.field;
                                        return (_jsx(Select, __assign({}, field, { options: organizationSizeOptions, placeholder: t('form.requestTrialForm.fields.organizationSize.placeholder'), error: ((_b = errors === null || errors === void 0 ? void 0 : errors.email) === null || _b === void 0 ? void 0 : _b.message) || undefined })));
                                    }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationSize }) })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.requestTrialForm.fields.country.label') }), _jsx(FieldRow, { children: _jsx(Controller, { name: 'country', control: control, rules: { required: true }, render: function (_a) {
                                        var field = _a.field;
                                        return (_jsx(SelectFiltered, __assign({}, field, { options: countryOptions, width: 'full', placeholder: t('form.requestTrialForm.fields.country.placeholder') })));
                                    }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.country }) })] }), _jsx(Field, { children: _jsxs(Box, __assign({ mbs: 24 }, { children: [_jsxs(Box, __assign({ mbe: 8, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', fontScale: 'c1', lineHeight: 20 }, { children: [_jsx(CheckBox, __assign({ mie: 8 }, register('updates'))), ' ', _jsx(Box, __assign({ is: 'label', htmlFor: 'updates' }, { children: t('form.registeredServerForm.keepInformed') }))] })), _jsxs(Box, __assign({ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', color: 'default', fontScale: 'c1', lineHeight: 20 }, { children: [_jsx(CheckBox, __assign({ mie: 8 }, register('agreement', { required: true }))), ' ', _jsx(Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", _jsx("a", __assign({ href: termsHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", _jsx("a", __assign({ href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] }))] })) }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.requestTrialForm.hasWorkspace.label') }), _jsx(FieldDescription, { children: t('form.requestTrialForm.hasWorkspace.description') })] })] }), _jsx(Form.Footer, { children: _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.requestTrialForm.button.text') })) })] })));
};
module.exportDefault(RequestTrialForm);
//# sourceMappingURL=RequestTrialForm.js.map