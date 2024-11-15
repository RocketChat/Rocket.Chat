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
var CreateNewPassword = function (_a) {
    var onSubmit = _a.onSubmit, validatePassword = _a.validatePassword, validatePasswordConfirmation = _a.validatePasswordConfirmation, initialValues = _a.initialValues;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _b = (0, react_hook_form_1.useForm)({
        mode: 'onChange',
        defaultValues: __assign({}, initialValues),
    }), register = _b.register, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, isValid = _c.isValid, errors = _c.errors;
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.createPasswordForm.fields.password.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.PasswordInput, __assign({}, register('password', {
                                        validate: validatePassword,
                                        required: true,
                                    }), { placeholder: t('form.createPasswordForm.fields.password.placeholder') })) }), errors.password && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.password.message }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.createPasswordForm.fields.confirmPassword.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.PasswordInput, __assign({}, register('passwordConfirmation', {
                                        validate: validatePasswordConfirmation,
                                        required: true,
                                    }), { placeholder: t('form.createPasswordForm.fields.confirmPassword.placeholder') })) }), errors.passwordConfirmation && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.passwordConfirmation.message }))] })] }) }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.ButtonGroup, __assign({ flexGrow: 1 }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.createPasswordForm.button.text') })) })) })] })));
};
exports.default = CreateNewPassword;
//# sourceMappingURL=CreateNewPassword.js.map