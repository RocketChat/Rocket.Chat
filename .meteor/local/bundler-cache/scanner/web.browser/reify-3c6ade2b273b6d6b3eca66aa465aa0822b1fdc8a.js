let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,ButtonGroup,Button;module.link('@rocket.chat/fuselage',{Box(v){Box=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v}},1);let useForm,FormProvider;module.link('react-hook-form',{useForm(v){useForm=v},FormProvider(v){FormProvider=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let Form;module.link('../../common/Form',{default(v){Form=v}},4);let List;module.link('../../common/List',{default(v){List=v}},5);var __assign = (this && this.__assign) || function () {
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






var StandaloneServerForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, initialValues = _a.initialValues, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick;
    var t = useTranslation().t;
    var form = useForm({
        mode: 'onChange',
        defaultValues: __assign({ registerType: 'standalone' }, initialValues),
    });
    var _b = form.formState, isValidating = _b.isValidating, isSubmitting = _b.isSubmitting, isValid = _b.isValid, handleSubmit = form.handleSubmit;
    return (_jsx(FormProvider, __assign({}, form, { children: _jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), _jsx(Form.Title, { children: t('form.standaloneServerForm.title') }, void 0), _jsx(Box, __assign({ mbe: 'x24', mbs: 'x16' }, { children: _jsxs(List, { children: [_jsx(List.Item, __assign({ fontScale: 'c2', icon: 'warning', iconColor: 'warning' }, { children: t('form.standaloneServerForm.servicesUnavailable') }), void 0), _jsx(List.Item, __assign({ fontScale: 'c1', icon: 'info', iconColor: 'neutral' }, { children: t('form.standaloneServerForm.publishOwnApp') }), void 0), _jsx(List.Item, __assign({ fontScale: 'c1', icon: 'info', iconColor: 'neutral' }, { children: t('form.standaloneServerForm.manuallyIntegrate') }), void 0)] }, void 0) }), void 0), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, { children: [_jsx(Button, __assign({ onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0), _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.confirm') }), void 0)] }, void 0) }, void 0)] }), void 0) }), void 0));
};
module.exportDefault(StandaloneServerForm);
//# sourceMappingURL=StandaloneServerForm.js.map