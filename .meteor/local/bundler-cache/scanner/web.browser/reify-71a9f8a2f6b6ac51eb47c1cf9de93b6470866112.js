let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,NumberInput,TextInput,Button;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},NumberInput(v){NumberInput=v},TextInput(v){TextInput=v},Button(v){Button=v}},1);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let ActionLink;module.link('../../common/ActionLink',{default(v){ActionLink=v}},4);let Form;module.link('../../common/Form',{default(v){Form=v}},5);let TotpActionsWrapper;module.link('./TotpForm.styles',{TotpActionsWrapper(v){TotpActionsWrapper=v}},6);var __assign = (this && this.__assign) || function () {
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







var TotpForm = function (_a) {
    var onSubmit = _a.onSubmit, initialValues = _a.initialValues, _b = _a.isBackupCode, isBackupCode = _b === void 0 ? false : _b, onChangeTotpForm = _a.onChangeTotpForm;
    var t = useTranslation().t;
    var _c = useForm({
        defaultValues: __assign({}, initialValues),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, errors = _d.errors, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting;
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Container, { children: _jsx(FieldGroup, { children: _jsxs(Field, { children: [isBackupCode ? (_jsx(Field.Label, { children: t('form.totpForm.fields.backupCode.label') }, void 0)) : (_jsx(Field.Label, { children: t('form.totpForm.fields.totpCode.label') }, void 0)), _jsx(Field.Row, { children: isBackupCode ? (_jsx(TextInput, __assign({}, register('backupCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.backupCode.placeholder') }), void 0)) : (_jsx(NumberInput, __assign({}, register('totpCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.totpCode.placeholder') }), void 0)) }, void 0), errors.backupCode && (_jsx(Field.Error, { children: errors.backupCode.message }, void 0)), errors.totpCode && (_jsx(Field.Error, { children: errors.totpCode.message }, void 0))] }, void 0) }, void 0) }, void 0), _jsx(Form.Footer, { children: _jsxs(TotpActionsWrapper, { children: [_jsx(Button, __assign({ type: 'submit', disabled: isValidating || isSubmitting, primary: true }, { children: t('form.totpForm.button.text') }), void 0), _jsx(ActionLink, __assign({ fontScale: 'p2', onClick: onChangeTotpForm }, { children: isBackupCode
                                ? t('form.totpForm.buttonTotpCode.text')
                                : t('form.totpForm.buttonBackupCode.text') }), void 0)] }, void 0) }, void 0)] }), void 0));
};
module.exportDefault(TotpForm);
//# sourceMappingURL=TotpForm.js.map