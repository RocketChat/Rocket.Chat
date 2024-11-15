let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,ButtonGroup,Button,Field,EmailInput,FieldLabel,FieldRow,FieldError,FieldGroup;module.link('@rocket.chat/fuselage',{Box(v){Box=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Field(v){Field=v},EmailInput(v){EmailInput=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v},FieldGroup(v){FieldGroup=v}},1);let useUniqueId,useBreakpoints;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v},useBreakpoints(v){useBreakpoints=v}},2);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},3);let useEffect,useRef;module.link('react',{useEffect(v){useEffect=v},useRef(v){useRef=v}},4);let Controller,useForm,FormProvider;module.link('react-hook-form',{Controller(v){Controller=v},useForm(v){useForm=v},FormProvider(v){FormProvider=v}},5);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},6);let AgreeTermsField;module.link('../../common/AgreeTermsField',{default(v){AgreeTermsField=v}},7);var __assign = (this && this.__assign) || function () {
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








var RegisterServerForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, initialValues = _a.initialValues, validateEmail = _a.validateEmail, offline = _a.offline, onSubmit = _a.onSubmit, _b = _a.termsHref, termsHref = _b === void 0 ? 'https://rocket.chat/terms' : _b, _c = _a.policyHref, policyHref = _c === void 0 ? 'https://rocket.chat/privacy' : _c, onClickRegisterOffline = _a.onClickRegisterOffline;
    var t = useTranslation().t;
    var formId = useUniqueId();
    var emailField = useUniqueId();
    var agreementField = useUniqueId();
    var registerServerFormRef = useRef(null);
    var breakpoints = useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var form = useForm({
        mode: 'onBlur',
        defaultValues: __assign({ email: '', agreement: false, updates: true }, initialValues),
    });
    var control = form.control, register = form.register, _d = form.formState, isSubmitting = _d.isSubmitting, isValidating = _d.isValidating, errors = _d.errors, handleSubmit = form.handleSubmit;
    useEffect(function () {
        if (registerServerFormRef.current) {
            registerServerFormRef.current.focus();
        }
    }, []);
    return (_jsx(FormProvider, __assign({}, form, { children: _jsxs(Form, __assign({ ref: registerServerFormRef, tabIndex: -1, "aria-labelledby": "".concat(formId, "-title"), "aria-describedby": "".concat(formId, "-informed-disclaimer ").concat(formId, "-engagement-disclaimer"), onSubmit: handleSubmit(onSubmit) }, { children: [_jsxs(Form.Header, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }), _jsx(Form.Title, __assign({ id: "".concat(formId, "-title") }, { children: t('form.registeredServerForm.title') }))] }), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, __assign({ required: true, display: 'flex', alignItems: 'center', htmlFor: emailField }, { children: t('form.registeredServerForm.fields.accountEmail.inputLabel') })), _jsx(FieldRow, { children: _jsx(Controller, { name: 'email', control: control, rules: {
                                                required: String(t('component.form.requiredField')),
                                                validate: validateEmail,
                                            }, render: function (_a) {
                                                var field = _a.field;
                                                return (_jsx(EmailInput, __assign({}, field, { "aria-invalid": Boolean(errors.email), "aria-required": 'true', "aria-describedby": "".concat(emailField, "-error"), placeholder: t('form.registeredServerForm.fields.accountEmail.inputPlaceholder'), id: emailField })));
                                            } }) }), errors.email && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(emailField, "-error") }, { children: t('component.form.requiredField') })))] }), _jsx(AgreeTermsField, { agreementField: agreementField, termsHref: termsHref, policyHref: policyHref, control: control, errors: errors }), _jsx("input", __assign({ type: 'hidden' }, register('updates')))] }) }), _jsx(Form.Footer, { children: _jsxs(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }, { children: [_jsxs(ButtonGroup, __assign({ vertical: isMobile, flexGrow: 1 }, { children: [_jsx(Button, __assign({ type: 'submit', primary: true, disabled: isSubmitting || isValidating || offline }, { children: t('component.form.action.registerWorkspace') })), offline && (_jsx(Button, __assign({ type: 'button', disabled: !offline, onClick: onClickRegisterOffline }, { children: t('component.form.action.registerOffline') })))] })), _jsx(Box, __assign({ id: "".concat(formId, "-engagement-disclaimer"), mbs: 24, fontScale: 'c1' }, { children: t('form.registeredServerForm.registrationEngagement') })), _jsx(Box, __assign({ id: "".concat(formId, "-informed-disclaimer"), mbs: 24, fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'form.registeredServerForm.registrationKeepInformed' }, { children: ["By submitting this form you consent to receive more information about Rocket.Chat products, events and updates, according to our", _jsx("a", __assign({ href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" })), ". You may unsubscribe at any time."] })) }))] })) })] })) })));
};
module.exportDefault(RegisterServerForm);
//# sourceMappingURL=RegisterServerForm.js.map