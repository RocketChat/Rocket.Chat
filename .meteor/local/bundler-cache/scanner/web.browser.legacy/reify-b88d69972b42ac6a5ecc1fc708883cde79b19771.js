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
var CreateFirstMemberForm = function (_a) {
    var _b;
    var defaultValues = _a.defaultValues, currentStep = _a.currentStep, stepCount = _a.stepCount, organizationName = _a.organizationName, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, validateUsername = _a.validateUsername, validatePassword = _a.validatePassword;
    var t = react_i18next_1.useTranslation().t;
    var _c = react_hook_form_1.useForm({ mode: 'onChange' }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValid = _d.isValid, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, errors = _d.errors;
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), jsx_runtime_1.jsx(Form_1.default.Title, { children: t('form.createFirstMemberForm.title') }, void 0), jsx_runtime_1.jsx(Form_1.default.Subtitle, { children: t('form.createFirstMemberForm.subtitle', { organizationName: organizationName }) }, void 0), jsx_runtime_1.jsxs(fuselage_1.FieldGroup, __assign({ mbs: 'x16' }, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'inline', mie: 'x8' }, { children: t('form.createFirstMemberForm.fields.username.label') }), void 0) }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('username', {
                                    validate: validateUsername,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.username, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.username) === null || _b === void 0 ? void 0 : _b.type) || undefined }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.username) && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.username.message }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.createFirstMemberForm.fields.password.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.PasswordInput, __assign({}, register('password', {
                                    validate: validatePassword,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.password }), void 0) }, void 0), errors.password && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.password.message }, void 0))] }, void 0)] }), void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsxs(fuselage_1.ButtonGroup, { children: [jsx_runtime_1.jsx(fuselage_1.Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0), jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.createFirstMemberForm.button.submit') }), void 0)] }, void 0) }, void 0)] }), void 0));
};
exports.default = CreateFirstMemberForm;
//# sourceMappingURL=CreateFirstMemberForm.js.map