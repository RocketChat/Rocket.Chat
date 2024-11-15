let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldLabel,FieldRow,FieldGroup,Field,FieldError,ButtonGroup,Button,Box,Divider,EmailInput,TextInput,Select,CheckBox,Grid;module.link('@rocket.chat/fuselage',{FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldGroup(v){FieldGroup=v},Field(v){Field=v},FieldError(v){FieldError=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Box(v){Box=v},Divider(v){Divider=v},EmailInput(v){EmailInput=v},TextInput(v){TextInput=v},Select(v){Select=v},CheckBox(v){CheckBox=v},Grid(v){Grid=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);let useForm,Controller;module.link('react-hook-form',{useForm(v){useForm=v},Controller(v){Controller=v}},3);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},4);let Tooltip;module.link('../../common/InformationTooltipTrigger',{default(v){Tooltip=v}},5);let WorkspaceUrlInput;module.link('./WorkspaceUrlInput',{default(v){WorkspaceUrlInput=v}},6);var __assign = (this && this.__assign) || function () {
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







var CreateCloudWorkspaceForm = function (_a) {
    var _b, _c, _d;
    var defaultValues = _a.defaultValues, onSubmit = _a.onSubmit, domain = _a.domain, serverRegionOptions = _a.serverRegionOptions, languageOptions = _a.languageOptions, onBackButtonClick = _a.onBackButtonClick, validateUrl = _a.validateUrl, validateEmail = _a.validateEmail;
    var t = useTranslation().t;
    var _e = useForm({ mode: 'onChange' }), register = _e.register, control = _e.control, handleSubmit = _e.handleSubmit, setValue = _e.setValue, _f = _e.formState, isValid = _f.isValid, isValidating = _f.isValidating, isSubmitting = _f.isSubmitting, errors = _f.errors;
    var onNameBlur = function (e) {
        var fieldValue = e.target.value;
        var workspaceURL = fieldValue.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        setValue('workspaceURL', workspaceURL, { shouldValidate: true });
    };
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Header, { children: _jsx(Form.Title, { children: t('form.createCloudWorkspace.title') }) }), _jsxs(FieldGroup, __assign({ mbs: 16 }, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: t('form.createCloudWorkspace.fields.orgEmaillabel') }), _jsx(FieldRow, { children: _jsx(EmailInput, __assign({}, register('organizationEmail', {
                                    required: true,
                                    validate: validateEmail,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationEmail, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.organizationEmail) === null || _b === void 0 ? void 0 : _b.type) || undefined })) }), (errors === null || errors === void 0 ? void 0 : errors.organizationEmail) && (_jsx(FieldError, { children: errors.organizationEmail.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: _jsx(Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.workspaceNamelabel') })) }), _jsx(FieldRow, { children: _jsx(TextInput, __assign({}, register('workspaceName', { required: true }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceName, error: ((_c = errors === null || errors === void 0 ? void 0 : errors.workspaceName) === null || _c === void 0 ? void 0 : _c.type) || undefined, onBlur: onNameBlur })) }), errors.workspaceName && (_jsx(FieldError, { children: t('component.form.requiredField') }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: _jsx(Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.workspaceUrllabel') })) }), _jsx(FieldRow, { children: _jsx(WorkspaceUrlInput, __assign({ domain: domain }, register('workspaceURL', {
                                    required: true,
                                    validate: validateUrl,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceURL })) }), (errors === null || errors === void 0 ? void 0 : errors.workspaceURL) && (_jsx(FieldError, { children: errors.workspaceURL.message }))] }), _jsxs(Grid, __assign({ mb: 16 }, { children: [_jsx(Grid.Item, { children: _jsxs(Field, { children: [_jsxs(FieldLabel, { children: [_jsx(Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.serverRegionlabel') })), _jsx(Tooltip, { text: t('form.createCloudWorkspace.fields.serverRegion.tooltip') })] }), _jsx(FieldRow, { children: _jsx(Controller, { name: 'serverRegion', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.serverRegion, render: function (_a) {
                                                    var field = _a.field;
                                                    return (_jsx(Select, __assign({}, field, { options: serverRegionOptions, placeholder: t('form.createCloudWorkspace.fields.serverRegionlabel') })));
                                                } }) })] }) }), _jsx(Grid.Item, { children: _jsxs(Field, { children: [_jsxs(FieldLabel, { children: [_jsx(Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.languagelabel') })), _jsx(Tooltip, { text: t('form.createCloudWorkspace.fields.language.tooltip') })] }), _jsx(FieldRow, { children: _jsx(Controller, { name: 'language', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.language, render: function (_a) {
                                                    var field = _a.field;
                                                    return (_jsx(Select, __assign({}, field, { options: languageOptions, placeholder: t('form.createCloudWorkspace.fields.languagelabel') })));
                                                } }) })] }) })] })), _jsx(Divider, { mb: 0 }), _jsxs(Field, { children: [_jsxs(FieldRow, __assign({ justifyContent: 'flex-start' }, { children: [_jsx(CheckBox, __assign({}, register('agreement', { required: true }), { mie: 8 })), _jsx(Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", _jsx("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", _jsx("a", __assign({ href: 'https://rocket.chat/privacy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] })), ((_d = errors.agreement) === null || _d === void 0 ? void 0 : _d.type) === 'required' && (_jsx(FieldError, { children: t('component.form.requiredField') }))] }), _jsx(Field, { children: _jsxs(FieldRow, __assign({ justifyContent: 'flex-start' }, { children: [_jsx(CheckBox, __assign({}, register('updates'), { mie: 8 })), _jsx(Box, __assign({ fontScale: 'c1' }, { children: t('form.createCloudWorkspace.fields.keepMeInformed') }))] })) })] })), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, { children: [onBackButtonClick && (_jsx(Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }))), _jsx(Button, __assign({ type: 'submit', primary: true, disabled: !isValid, loading: isSubmitting || isValidating }, { children: t('component.form.action.next') }))] }) })] })));
};
module.exportDefault(CreateCloudWorkspaceForm);
//# sourceMappingURL=CreateCloudWorkspaceForm.js.map