let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,ButtonGroup,Button,Field,EmailInput,CheckBox,Icon;module.link('@rocket.chat/fuselage',{Box(v){Box=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Field(v){Field=v},EmailInput(v){EmailInput=v},CheckBox(v){CheckBox=v},Icon(v){Icon=v}},1);let useUniqueId,useBreakpoints;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v},useBreakpoints(v){useBreakpoints=v}},2);let useForm,FormProvider;module.link('react-hook-form',{useForm(v){useForm=v},FormProvider(v){FormProvider=v}},3);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},4);let ActionLink;module.link('../../common/ActionLink',{default(v){ActionLink=v}},5);let Form;module.link('../../common/Form',{default(v){Form=v}},6);let List;module.link('../../common/List',{default(v){List=v}},7);var __assign = (this && this.__assign) || function () {
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
    var currentStep = _a.currentStep, stepCount = _a.stepCount, initialValues = _a.initialValues, validateEmail = _a.validateEmail, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, onClickContinue = _a.onClickContinue, _b = _a.termsHref, termsHref = _b === void 0 ? 'https://rocket.chat/terms' : _b, _c = _a.policyHref, policyHref = _c === void 0 ? 'https://rocket.chat/privacy' : _c;
    var t = useTranslation().t;
    var emailField = useUniqueId();
    var breakpoints = useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var form = useForm({
        mode: 'onChange',
        defaultValues: __assign({ email: '', registerType: 'registered', agreement: false, updates: true }, initialValues),
    });
    var register = form.register, _d = form.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, isValid = _d.isValid, errors = _d.errors, handleSubmit = form.handleSubmit;
    return (_jsx(FormProvider, __assign({}, form, { children: _jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), _jsx(Form.Title, { children: t('form.registeredServerForm.title') }, void 0), _jsx(Box, __assign({ mbe: 'x24', mbs: 'x16' }, { children: _jsxs(List, { children: [_jsx(List.Item, __assign({ fontScale: 'p2', icon: 'check' }, { children: t('form.registeredServerForm.included.push') }), void 0), _jsx(List.Item, __assign({ fontScale: 'p2', icon: 'check' }, { children: t('form.registeredServerForm.included.externalProviders') }), void 0), _jsx(List.Item, __assign({ fontScale: 'p2', icon: 'check' }, { children: t('form.registeredServerForm.included.apps') }), void 0)] }, void 0) }), void 0), _jsxs(Form.Container, { children: [_jsxs(Field, { children: [_jsxs(Field.Label, __assign({ display: 'flex', alignItems: 'center', htmlFor: emailField }, { children: [t('form.registeredServerForm.fields.accountEmail.inputLabel'), _jsx(Icon, { title: t('form.registeredServerForm.fields.accountEmail.tooltipLabel'), mis: 'x4', size: 'x16', name: 'info' }, void 0)] }), void 0), _jsx(Field.Row, { children: _jsx(EmailInput, __assign({}, register('email', {
                                        required: true,
                                        validate: validateEmail,
                                    }), { placeholder: t('form.registeredServerForm.fields.accountEmail.inputPlaceholder'), id: emailField }), void 0) }, void 0), errors.email && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), _jsxs(Box, __assign({ mbs: 'x24' }, { children: [_jsxs(Box, __assign({ mbe: 'x8', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', fontScale: 'c1', lineHeight: 20 }, { children: [_jsx(CheckBox, __assign({ mie: 'x8' }, register('updates')), void 0), ' ', _jsx(Box, __assign({ is: 'label', htmlFor: 'updates' }, { children: t('form.registeredServerForm.keepInformed') }), void 0)] }), void 0), _jsxs(Box, __assign({ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', color: 'default', fontScale: 'c1', lineHeight: 20 }, { children: [_jsx(CheckBox, __assign({ mie: 'x8' }, register('agreement', { required: true })), void 0), ' ', _jsx(Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", _jsx("a", __assign({ href: termsHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" }), void 0), "and", _jsx("a", __assign({ href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }), void 0)] }), void 0) }), void 0)] }), void 0), _jsx(Box, __assign({ mbs: 'x32', fontScale: 'c1', htmlFor: 'agreement', withRichContent: true }, { children: t('form.registeredServerForm.agreeToReceiveUpdates') }), void 0)] }), void 0)] }, void 0), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, __assign({ vertical: isMobile }, { children: [_jsx(Button, __assign({ onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0), _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.register') }), void 0), _jsx(Box, __assign({ withTruncatedText: true, flexGrow: 1 }, { children: _jsx(ButtonGroup, __assign({ flexGrow: 1, align: 'end' }, { children: _jsx(ActionLink, __assign({ onClick: onClickContinue }, { children: t('form.registeredServerForm.continueStandalone') }), void 0) }), void 0) }), void 0)] }), void 0) }, void 0)] }), void 0) }), void 0));
};
module.exportDefault(RegisterServerForm);
//# sourceMappingURL=RegisteredServerForm.js.map