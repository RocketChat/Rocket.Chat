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
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var layout_1 = require("@rocket.chat/layout");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var CreateFirstMemberForm = function (_a) {
    var _b;
    var defaultValues = _a.defaultValues, currentStep = _a.currentStep, stepCount = _a.stepCount, organizationName = _a.organizationName, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, validateUsername = _a.validateUsername, validatePassword = _a.validatePassword;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _c = (0, react_hook_form_1.useForm)({ mode: 'onChange' }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValid = _d.isValid, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, errors = _d.errors;
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Steps, { currentStep: currentStep, stepCount: stepCount }), (0, jsx_runtime_1.jsx)(layout_1.Form.Title, { children: t('form.createFirstMemberForm.title') }), (0, jsx_runtime_1.jsx)(layout_1.Form.Subtitle, { children: t('form.createFirstMemberForm.subtitle', { organizationName: organizationName }) }), (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, __assign({ mbs: 16 }, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'inline', mie: 8 }, { children: t('form.createFirstMemberForm.fields.username.label') })) }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, register('username', {
                                    validate: validateUsername,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.username, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.username) === null || _b === void 0 ? void 0 : _b.type) || undefined })) }), (errors === null || errors === void 0 ? void 0 : errors.username) && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.username.message }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.createFirstMemberForm.fields.password.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.PasswordInput, __assign({}, register('password', {
                                    validate: validatePassword,
                                    required: true,
                                }), { defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.password })) }), errors.password && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.password.message }))] })] })), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.ButtonGroup, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') })), (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid, minHeight: 'x40' }, { children: isSubmitting ? ((0, jsx_runtime_1.jsx)(fuselage_1.Throbber, { inheritColor: true })) : (t('form.createFirstMemberForm.button.submit')) }))] }) })] })));
};
exports.default = CreateFirstMemberForm;
//# sourceMappingURL=CreateFirstMemberForm.js.map