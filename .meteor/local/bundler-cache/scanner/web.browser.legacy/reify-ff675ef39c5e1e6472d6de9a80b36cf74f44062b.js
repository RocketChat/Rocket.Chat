"use strict";
var __assign = (this && this.__assign) || function () {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var Form_1 = __importDefault(require("../../common/Form"));
var InformationTooltipTrigger_1 = __importDefault(require("../../common/InformationTooltipTrigger"));
var WorkspaceUrlInput_1 = __importDefault(require("./WorkspaceUrlInput"));
var CreateCloudWorkspaceForm = function (_a) {
    var _b, _c, _d;
    var defaultValues = _a.defaultValues, onSubmit = _a.onSubmit, domain = _a.domain, serverRegionOptions = _a.serverRegionOptions, languageOptions = _a.languageOptions, onBackButtonClick = _a.onBackButtonClick, validateUrl = _a.validateUrl, validateEmail = _a.validateEmail;
    var t = react_i18next_1.useTranslation().t;
    var _e = react_hook_form_1.useForm({ mode: 'onChange' }), register = _e.register, control = _e.control, handleSubmit = _e.handleSubmit, setValue = _e.setValue, _f = _e.formState, isValid = _f.isValid, isValidating = _f.isValidating, isSubmitting = _f.isSubmitting, errors = _f.errors;
    var onNameBlur = function (e) {
        var fieldValue = e.target.value;
        var workspaceURL = fieldValue.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        setValue('workspaceURL', workspaceURL, { shouldValidate: true });
    };
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Title, { children: t('form.createCloudWorkspace.title') }, void 0), jsx_runtime_1.jsxs(fuselage_1.FieldGroup, __assign({ mbs: 'x16' }, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.createCloudWorkspace.fields.orgEmail.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.EmailInput, __assign({}, register('organizationEmail', {
                                    required: true,
                                    validate: validateEmail,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationEmail, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.organizationEmail) === null || _b === void 0 ? void 0 : _b.type) || undefined }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.organizationEmail) && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.organizationEmail.message }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.workspaceName.label') }), void 0) }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('workspaceName', { required: true }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceName, error: ((_c = errors === null || errors === void 0 ? void 0 : errors.workspaceName) === null || _c === void 0 ? void 0 : _c.type) || undefined, onBlur: onNameBlur }), void 0) }, void 0), errors.workspaceName && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.workspaceUrl.label') }), void 0) }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(WorkspaceUrlInput_1.default, __assign({ domain: domain }, register('workspaceURL', {
                                    required: true,
                                    validate: validateUrl,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceURL }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.workspaceURL) && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.workspaceURL.message }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Grid, __assign({ mb: 'x16' }, { children: [jsx_runtime_1.jsx(fuselage_1.Grid.Item, { children: jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsxs(fuselage_1.Field.Label, { children: [jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.serverRegion.label') }), void 0), jsx_runtime_1.jsx(InformationTooltipTrigger_1.default, { text: t('form.createCloudWorkspace.fields.serverRegion.tooltip') }, void 0)] }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'serverRegion', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.serverRegion, render: function (_a) {
                                                    var field = _a.field;
                                                    return (jsx_runtime_1.jsx(fuselage_1.Select, __assign({}, field, { options: serverRegionOptions, placeholder: t('form.createCloudWorkspace.fields.serverRegion.label') }), void 0));
                                                } }, void 0) }, void 0)] }, void 0) }, void 0), jsx_runtime_1.jsx(fuselage_1.Grid.Item, { children: jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsxs(fuselage_1.Field.Label, { children: [jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createCloudWorkspace.fields.language.label') }), void 0), jsx_runtime_1.jsx(InformationTooltipTrigger_1.default, { text: t('form.createCloudWorkspace.fields.language.tooltip') }, void 0)] }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'language', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.language, render: function (_a) {
                                                    var field = _a.field;
                                                    return (jsx_runtime_1.jsx(fuselage_1.Select, __assign({}, field, { options: languageOptions, placeholder: t('form.createCloudWorkspace.fields.language.label') }), void 0));
                                                } }, void 0) }, void 0)] }, void 0) }, void 0)] }), void 0), jsx_runtime_1.jsx(fuselage_1.Divider, { mb: 'x0' }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsxs(fuselage_1.Field.Row, __assign({ justifyContent: 'flex-start' }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({}, register('agreement', { required: true }), { mie: 'x8' }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", jsx_runtime_1.jsx("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" }), void 0), "and", jsx_runtime_1.jsx("a", __assign({ href: 'https://rocket.chat/policy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }), void 0)] }), void 0) }), void 0)] }), void 0), ((_d = errors.agreement) === null || _d === void 0 ? void 0 : _d.type) === 'required' && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), jsx_runtime_1.jsx(fuselage_1.Field, { children: jsx_runtime_1.jsxs(fuselage_1.Field.Row, __assign({ justifyContent: 'flex-start' }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({}, register('updates'), { mie: 'x8' }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'c1' }, { children: t('form.createCloudWorkspace.fields.keepMeInformed') }), void 0)] }), void 0) }, void 0)] }), void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsxs(fuselage_1.ButtonGroup, { children: [onBackButtonClick && (jsx_runtime_1.jsx(fuselage_1.Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0)), jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.next') }), void 0)] }, void 0) }, void 0)] }), void 0));
};
exports.default = CreateCloudWorkspaceForm;
//# sourceMappingURL=CreateCloudWorkspaceForm.js.map