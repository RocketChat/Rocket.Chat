let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let FieldGroup,Field,ButtonGroup,Button,Box,Divider,EmailInput,TextInput,Select,CheckBox,Grid;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},Field(v){Field=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Box(v){Box=v},Divider(v){Divider=v},EmailInput(v){EmailInput=v},TextInput(v){TextInput=v},Select(v){Select=v},CheckBox(v){CheckBox=v},Grid(v){Grid=v}},1);let useForm,Controller;module.link('react-hook-form',{useForm(v){useForm=v},Controller(v){Controller=v}},2);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},3);let Form;module.link('../../common/Form',{default(v){Form=v}},4);let Tooltip;module.link('../../common/InformationTooltipTrigger',{default(v){Tooltip=v}},5);let WorkspaceUrlInput;module.link('./WorkspaceUrlInput',{default(v){WorkspaceUrlInput=v}},6);var __assign = (this && this.__assign) || function () {
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
    return (_jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Title, { children: t('form.createCloudWorkspace.title') }, void 0), _jsxs(FieldGroup, __assign({ mbs: 'x16' }, { children: [_jsxs(Field, { children: [_jsx(Field.Label, { children: t('form.createCloudWorkspace.fields.orgEmail.label') }, void 0), _jsx(Field.Row, { children: _jsx(EmailInput, __assign({}, register('organizationEmail', {
                                    required: true,
                                    validate: validateEmail,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationEmail, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.organizationEmail) === null || _b === void 0 ? void 0 : _b.type) || undefined }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.organizationEmail) && (_jsx(Field.Error, { children: errors.organizationEmail.message }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, { children: _jsx(Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.workspaceName.label') }), void 0) }, void 0), _jsx(Field.Row, { children: _jsx(TextInput, __assign({}, register('workspaceName', { required: true }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceName, error: ((_c = errors === null || errors === void 0 ? void 0 : errors.workspaceName) === null || _c === void 0 ? void 0 : _c.type) || undefined, onBlur: onNameBlur }), void 0) }, void 0), errors.workspaceName && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), _jsxs(Field, { children: [_jsx(Field.Label, { children: _jsx(Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.workspaceUrl.label') }), void 0) }, void 0), _jsx(Field.Row, { children: _jsx(WorkspaceUrlInput, __assign({ domain: domain }, register('workspaceURL', {
                                    required: true,
                                    validate: validateUrl,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceURL }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.workspaceURL) && (_jsx(Field.Error, { children: errors.workspaceURL.message }, void 0))] }, void 0), _jsxs(Grid, __assign({ mb: 'x16' }, { children: [_jsx(Grid.Item, { children: _jsxs(Field, { children: [_jsxs(Field.Label, { children: [_jsx(Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.serverRegion.label') }), void 0), _jsx(Tooltip, { text: t('form.createCloudWorkspace.fields.serverRegion.tooltip') }, void 0)] }, void 0), _jsx(Field.Row, { children: _jsx(Controller, { name: 'serverRegion', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.serverRegion, render: function (_a) {
                                                    var field = _a.field;
                                                    return (_jsx(Select, __assign({}, field, { options: serverRegionOptions, placeholder: t('form.createCloudWorkspace.fields.serverRegion.label') }), void 0));
                                                } }, void 0) }, void 0)] }, void 0) }, void 0), _jsx(Grid.Item, { children: _jsxs(Field, { children: [_jsxs(Field.Label, { children: [_jsx(Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.language.label') }), void 0), _jsx(Tooltip, { text: t('form.createCloudWorkspace.fields.language.tooltip') }, void 0)] }, void 0), _jsx(Field.Row, { children: _jsx(Controller, { name: 'language', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.language, render: function (_a) {
                                                    var field = _a.field;
                                                    return (_jsx(Select, __assign({}, field, { options: languageOptions, placeholder: t('form.createCloudWorkspace.fields.language.label') }), void 0));
                                                } }, void 0) }, void 0)] }, void 0) }, void 0)] }), void 0), _jsx(Divider, { mb: 'x0' }, void 0), _jsxs(Field, { children: [_jsxs(Field.Row, __assign({ justifyContent: 'flex-start' }, { children: [_jsx(CheckBox, __assign({}, register('agreement', { required: true }), { mie: 'x8' }), void 0), _jsx(Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", _jsx("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" }), void 0), "and", _jsx("a", __assign({ href: 'https://rocket.chat/policy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }), void 0)] }), void 0) }), void 0)] }), void 0), ((_d = errors.agreement) === null || _d === void 0 ? void 0 : _d.type) === 'required' && (_jsx(Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), _jsx(Field, { children: _jsxs(Field.Row, __assign({ justifyContent: 'flex-start' }, { children: [_jsx(CheckBox, __assign({}, register('updates'), { mie: 'x8' }), void 0), _jsx(Box, __assign({ fontScale: 'c1' }, { children: t('form.createCloudWorkspace.fields.keepMeInformed') }), void 0)] }), void 0) }, void 0)] }), void 0), _jsx(Form.Footer, { children: _jsxs(ButtonGroup, { children: [onBackButtonClick && (_jsx(Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0)), _jsx(Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.next') }), void 0)] }, void 0) }, void 0)] }), void 0));
};
module.exportDefault(CreateCloudWorkspaceForm);
//# sourceMappingURL=CreateCloudWorkspaceForm.js.map