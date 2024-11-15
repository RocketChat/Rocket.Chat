let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldError,FieldLabel,FieldRow,FieldGroup,Field,ButtonGroup,Button,TextInput,Select,Box;module.link('@rocket.chat/fuselage',{FieldError(v){FieldError=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},TextInput(v){TextInput=v},Select(v){Select=v},Box(v){Box=v}},1);let useBreakpoints,useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useBreakpoints(v){useBreakpoints=v},useUniqueId(v){useUniqueId=v}},2);let ActionLink,Form;module.link('@rocket.chat/layout',{ActionLink(v){ActionLink=v},Form(v){Form=v}},3);let useRef,useEffect;module.link('react',{useRef(v){useRef=v},useEffect(v){useEffect=v}},4);let useForm,Controller;module.link('react-hook-form',{useForm(v){useForm=v},Controller(v){Controller=v}},5);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},6);var __assign = (this && this.__assign) || function () {
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







var OrganizationInfoForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, organizationIndustryOptions = _a.organizationIndustryOptions, organizationSizeOptions = _a.organizationSizeOptions, countryOptions = _a.countryOptions, nextStep = _a.nextStep, initialValues = _a.initialValues, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, onClickSkip = _a.onClickSkip;
    var t = useTranslation().t;
    var breakpoints = useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var formId = useUniqueId();
    var organizationNameField = useUniqueId();
    var organizationIndustryField = useUniqueId();
    var organizationSizeField = useUniqueId();
    var countryField = useUniqueId();
    var organizationInfoFormRef = useRef(null);
    var _b = useForm({
        defaultValues: initialValues,
        mode: 'onBlur',
    }), control = _b.control, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, errors = _c.errors;
    useEffect(function () {
        if (organizationInfoFormRef.current) {
            organizationInfoFormRef.current.focus();
        }
    }, []);
    return (_jsxs(Form, __assign({ ref: organizationInfoFormRef, tabIndex: -1, "aria-labelledby": "".concat(formId, "-title"), "aria-describedby": "".concat(formId, "-description"), onSubmit: handleSubmit(onSubmit) }, { children: [_jsxs(Form.Header, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }), _jsx(Form.Title, __assign({ id: "".concat(formId, "-title") }, { children: t('form.organizationInfoForm.title') })), _jsx(Form.Subtitle, __assign({ id: "".concat(formId, "-description") }, { children: t('form.organizationInfoForm.subtitle') }))] }), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: organizationNameField }, { children: t('form.organizationInfoForm.fields.organizationName.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'organizationName', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(TextInput, __assign({}, field, { placeholder: t('form.organizationInfoForm.fields.organizationName.placeholder'), "aria-describedby": "".concat(organizationNameField, "-error}"), "aria-required": 'true', "aria-invalid": Boolean(errors.organizationName), id: organizationNameField })));
                                        } }) }), errors.organizationName && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(organizationNameField, "-error}") }, { children: t('component.form.requiredField') })))] }), _jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: organizationIndustryField }, { children: t('form.organizationInfoForm.fields.organizationIndustry.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'organizationIndustry', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(Select, __assign({}, field, { options: organizationIndustryOptions, placeholder: t('form.organizationInfoForm.fields.organizationIndustry.placeholder'), "aria-required": 'true', "aria-invalid": Boolean(errors.organizationIndustry), "aria-describedby": "".concat(organizationIndustryField, "-error}"), id: organizationIndustryField })));
                                        } }) }), errors.organizationIndustry && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(organizationIndustryField, "-error}") }, { children: t('component.form.requiredField') })))] }), _jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: organizationSizeField }, { children: t('form.organizationInfoForm.fields.organizationSize.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'organizationSize', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(Select, __assign({}, field, { options: organizationSizeOptions, placeholder: t('form.organizationInfoForm.fields.organizationSize.placeholder'), "aria-required": 'true', "aria-invalid": Boolean(errors.organizationSize), "aria-describedby": "".concat(organizationSizeField, "-error}"), id: organizationSizeField })));
                                        } }) }), errors.organizationSize && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(organizationSizeField, "-error}") }, { children: t('component.form.requiredField') })))] }), _jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, htmlFor: countryField }, { children: t('form.organizationInfoForm.fields.country.label') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'country', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(Select, __assign({}, field, { options: countryOptions, placeholder: t('form.organizationInfoForm.fields.country.placeholder'), "aria-required": 'true', "aria-invalid": Boolean(errors.country), "aria-describedby": "".concat(countryField, "-error}"), id: countryField })));
                                        } }) }), errors.country && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(countryField, "-error}") }, { children: t('component.form.requiredField') })))] })] }) }), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, __assign({ vertical: isMobile }, { children: [onBackButtonClick && (_jsx(Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }))), _jsx(Button, __assign({ type: 'submit', primary: true, loading: isValidating || isSubmitting }, { children: nextStep !== null && nextStep !== void 0 ? nextStep : t('component.form.action.next') })), onClickSkip && (_jsx(Box, __assign({ withTruncatedText: true, flexGrow: 1 }, { children: _jsx(ButtonGroup, __assign({ align: 'end' }, { children: _jsx(ActionLink, __assign({ onClick: onClickSkip }, { children: t('component.form.action.skip') })) })) })))] })) })] })));
};
module.exportDefault(OrganizationInfoForm);
//# sourceMappingURL=OrganizationInfoForm.js.map