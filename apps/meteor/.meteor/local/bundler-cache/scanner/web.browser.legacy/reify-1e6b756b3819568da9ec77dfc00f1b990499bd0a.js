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
var layout_1 = require("@rocket.chat/layout");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var InformationTooltipTrigger_1 = __importDefault(require("../../common/InformationTooltipTrigger"));
var WorkspaceUrlInput_1 = __importDefault(require("./WorkspaceUrlInput"));
var CreateCloudWorkspaceForm = function (_a) {
    var _b, _c, _d;
    var defaultValues = _a.defaultValues, onSubmit = _a.onSubmit, domain = _a.domain, serverRegionOptions = _a.serverRegionOptions, languageOptions = _a.languageOptions, onBackButtonClick = _a.onBackButtonClick, validateUrl = _a.validateUrl, validateEmail = _a.validateEmail;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _e = (0, react_hook_form_1.useForm)({ mode: 'onChange' }), register = _e.register, control = _e.control, handleSubmit = _e.handleSubmit, setValue = _e.setValue, _f = _e.formState, isValid = _f.isValid, isValidating = _f.isValidating, isSubmitting = _f.isSubmitting, errors = _f.errors;
    var onNameBlur = function (e) {
        var fieldValue = e.target.value;
        var workspaceURL = fieldValue.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        setValue('workspaceURL', workspaceURL, { shouldValidate: true });
    };
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Header, { children: (0, jsx_runtime_1.jsx)(layout_1.Form.Title, { children: t('form.createCloudWorkspace.title') }) }), (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, __assign({ mbs: 16 }, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.createCloudWorkspace.fields.orgEmaillabel') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.EmailInput, __assign({}, register('organizationEmail', {
                                    required: true,
                                    validate: validateEmail,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationEmail, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.organizationEmail) === null || _b === void 0 ? void 0 : _b.type) || undefined })) }), (errors === null || errors === void 0 ? void 0 : errors.organizationEmail) && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.organizationEmail.message }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.workspaceNamelabel') })) }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, register('workspaceName', { required: true }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceName, error: ((_c = errors === null || errors === void 0 ? void 0 : errors.workspaceName) === null || _c === void 0 ? void 0 : _c.type) || undefined, onBlur: onNameBlur })) }), errors.workspaceName && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: t('component.form.requiredField') }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.workspaceUrllabel') })) }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(WorkspaceUrlInput_1.default, __assign({ domain: domain }, register('workspaceURL', {
                                    required: true,
                                    validate: validateUrl,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.workspaceURL })) }), (errors === null || errors === void 0 ? void 0 : errors.workspaceURL) && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.workspaceURL.message }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Grid, __assign({ mb: 16 }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Grid.Item, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.FieldLabel, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.serverRegionlabel') })), (0, jsx_runtime_1.jsx)(InformationTooltipTrigger_1.default, { text: t('form.createCloudWorkspace.fields.serverRegion.tooltip') })] }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'serverRegion', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.serverRegion, render: function (_a) {
                                                    var field = _a.field;
                                                    return ((0, jsx_runtime_1.jsx)(fuselage_1.Select, __assign({}, field, { options: serverRegionOptions, placeholder: t('form.createCloudWorkspace.fields.serverRegionlabel') })));
                                                } }) })] }) }), (0, jsx_runtime_1.jsx)(fuselage_1.Grid.Item, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.FieldLabel, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createCloudWorkspace.fields.languagelabel') })), (0, jsx_runtime_1.jsx)(InformationTooltipTrigger_1.default, { text: t('form.createCloudWorkspace.fields.language.tooltip') })] }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'language', control: control, rules: { required: true }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.language, render: function (_a) {
                                                    var field = _a.field;
                                                    return ((0, jsx_runtime_1.jsx)(fuselage_1.Select, __assign({}, field, { options: languageOptions, placeholder: t('form.createCloudWorkspace.fields.languagelabel') })));
                                                } }) })] }) })] })), (0, jsx_runtime_1.jsx)(fuselage_1.Divider, { mb: 0 }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.FieldRow, __assign({ justifyContent: 'flex-start' }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.CheckBox, __assign({}, register('agreement', { required: true }), { mie: 8 })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", (0, jsx_runtime_1.jsx)("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", (0, jsx_runtime_1.jsx)("a", __assign({ href: 'https://rocket.chat/privacy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] })), ((_d = errors.agreement) === null || _d === void 0 ? void 0 : _d.type) === 'required' && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: t('component.form.requiredField') }))] }), (0, jsx_runtime_1.jsx)(fuselage_1.Field, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.FieldRow, __assign({ justifyContent: 'flex-start' }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.CheckBox, __assign({}, register('updates'), { mie: 8 })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'c1' }, { children: t('form.createCloudWorkspace.fields.keepMeInformed') }))] })) })] })), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.ButtonGroup, { children: [onBackButtonClick && ((0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }))), (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.next') }))] }) })] })));
};
exports.default = CreateCloudWorkspaceForm;
//# sourceMappingURL=CreateCloudWorkspaceForm.js.map