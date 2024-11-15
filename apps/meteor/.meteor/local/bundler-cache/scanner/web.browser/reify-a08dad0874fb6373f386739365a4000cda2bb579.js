let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,NumberInput,TextInput,Button,FieldLabel,FieldRow,FieldError;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},NumberInput(v){NumberInput=v},TextInput(v){TextInput=v},Button(v){Button=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v}},1);let ActionLink,Form;module.link('@rocket.chat/layout',{ActionLink(v){ActionLink=v},Form(v){Form=v}},2);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);let TotpActionsWrapper;module.link('./TotpForm.styles',{TotpActionsWrapper(v){TotpActionsWrapper=v}},5);var __assign = (this && this.__assign) || function () {
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
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Container, { children: _jsx(FieldGroup, { children: _jsxs(Field, { children: [isBackupCode ? (_jsx(FieldLabel, { children: t('form.totpForm.fields.backupCode.label') })) : (_jsx(FieldLabel, { children: t('form.totpForm.fields.totpCode.label') })), _jsx(FieldRow, { children: isBackupCode ? (_jsx(TextInput, __assign({}, register('backupCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.backupCode.placeholder') }))) : (_jsx(NumberInput, __assign({}, register('totpCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.totpCode.placeholder') }))) }), errors.backupCode && (_jsx(FieldError, { children: errors.backupCode.message })), errors.totpCode && (_jsx(FieldError, { children: errors.totpCode.message }))] }) }) }), _jsx(Form.Footer, { children: _jsxs(TotpActionsWrapper, { children: [_jsx(Button, __assign({ type: 'submit', loading: isValidating || isSubmitting, primary: true }, { children: t('form.totpForm.button.text') })), _jsx(ActionLink, __assign({ fontScale: 'p2', onClick: onChangeTotpForm }, { children: isBackupCode
                                ? t('form.totpForm.buttonTotpCode.text')
                                : t('form.totpForm.buttonBackupCode.text') }))] }) })] })));
};
module.exportDefault(TotpForm);
//# sourceMappingURL=TotpForm.js.map