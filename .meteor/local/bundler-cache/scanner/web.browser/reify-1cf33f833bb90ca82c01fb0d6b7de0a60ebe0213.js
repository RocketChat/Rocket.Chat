let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,ButtonGroup,Button,TextInput,Select,SelectFiltered,Box;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},TextInput(v){TextInput=v},Select(v){Select=v},SelectFiltered(v){SelectFiltered=v},Box(v){Box=v}},1);let useBreakpoints,useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useBreakpoints(v){useBreakpoints=v},useUniqueId(v){useUniqueId=v}},2);let useEffect;module.link('react',{useEffect(v){useEffect=v}},3);let useForm,Controller;module.link('react-hook-form',{useForm(v){useForm=v},Controller(v){Controller=v}},4);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},5);let ActionLink;module.link('../../common/ActionLink',{default(v){ActionLink=v}},6);let Form;module.link('../../common/Form',{default(v){Form=v}},7);var __assign = (this && this.__assign) || function () {
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
    var currentStep = _a.currentStep, stepCount = _a.stepCount, organizationTypeOptions = _a.organizationTypeOptions, organizationIndustryOptions = _a.organizationIndustryOptions, organizationSizeOptions = _a.organizationSizeOptions, countryOptions = _a.countryOptions, nextStep = _a.nextStep, initialValues = _a.initialValues, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, onClickSkip = _a.onClickSkip;
    var t = useTranslation().t;
    var breakpoints = useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var organizationNameField = useUniqueId();
    var organizationTypeField = useUniqueId();
    var organizationIndustryField = useUniqueId();
    var organizationSizeField = useUniqueId();
    var countryField = useUniqueId();
    var _b = useForm({
        defaultValues: initialValues,
    }), register = _b.register, control = _b.control, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, errors = _c.errors, setFocus = _b.setFocus;
    useEffect(function () {
        setFocus('organizationName');
    }, [setFocus]);
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), _jsx(Form.Title, { children: t('form.organizationInfoForm.title') }, void 0), _jsx(Form.Subtitle, { children: t('form.organizationInfoForm.subtitle') }, void 0), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: organizationNameField }, { children: t('form.organizationInfoForm.fields.organizationName.label') }), void 0), _jsx(Field.Row, { children: _jsx(TextInput, __assign({}, register('organizationName', { required: true }), { placeholder: t('form.organizationInfoForm.fields.organizationName.placeholder'), id: organizationNameField }), void 0) }, void 0), errors.organizationName && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: organizationTypeField }, { children: t('form.organizationInfoForm.fields.organizationType.label') }), void 0), _jsx(Field.Row, { children: _jsx(Controller, { name: 'organizationType', control: control, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(Select, __assign({}, field, { options: organizationTypeOptions, placeholder: t('form.organizationInfoForm.fields.organizationType.placeholder'), id: organizationTypeField }), void 0));
                                        } }, void 0) }, void 0)] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: organizationIndustryField }, { children: t('form.organizationInfoForm.fields.organizationIndustry.label') }), void 0), _jsx(Field.Row, { children: _jsx(Controller, { name: 'organizationIndustry', control: control, rules: { required: true }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(Select, __assign({}, field, { options: organizationIndustryOptions, placeholder: t('form.organizationInfoForm.fields.organizationIndustry.placeholder'), id: organizationIndustryField }), void 0));
                                        } }, void 0) }, void 0), errors.organizationIndustry && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: organizationSizeField }, { children: t('form.organizationInfoForm.fields.organizationSize.label') }), void 0), _jsx(Field.Row, { children: _jsx(Controller, { name: 'organizationSize', control: control, rules: { required: true }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(Select, __assign({}, field, { options: organizationSizeOptions, placeholder: t('form.organizationInfoForm.fields.organizationSize.placeholder'), id: organizationSizeField }), void 0));
                                        } }, void 0) }, void 0), errors.organizationSize && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, __assign({ htmlFor: countryField }, { children: t('form.organizationInfoForm.fields.country.label') }), void 0), _jsx(Field.Row, { children: _jsx(Controller, { name: 'country', control: control, rules: { required: true }, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsx(SelectFiltered, __assign({}, field, { options: countryOptions, placeholder: t('form.organizationInfoForm.fields.country.placeholder'), id: countryField }), void 0));
                                        } }, void 0) }, void 0), errors.country && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0)] }, void 0) }, void 0), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, __assign({ vertical: isMobile, flexGrow: 1 }, { children: [onBackButtonClick && (_jsx(Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0)), _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting }, { children: nextStep !== null && nextStep !== void 0 ? nextStep : t('component.form.action.next') }), void 0), onClickSkip && (_jsx(Box, __assign({ withTruncatedText: true, flexGrow: 1 }, { children: _jsx(ButtonGroup, __assign({ flexGrow: 1, align: 'end' }, { children: _jsx(ActionLink, __assign({ onClick: onClickSkip }, { children: t('component.form.action.skip') }), void 0) }), void 0) }), void 0))] }), void 0) }, void 0)] }), void 0));
};
module.exportDefault(OrganizationInfoForm);
//# sourceMappingURL=OrganizationInfoForm.js.map