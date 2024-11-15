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
var ResetPasswordForm = function (_a) {
    var onSubmit = _a.onSubmit, validateEmail = _a.validateEmail, initialValues = _a.initialValues;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _b = (0, react_hook_form_1.useForm)({
        mode: 'onChange',
        defaultValues: __assign({}, initialValues),
    }), register = _b.register, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, isValid = _c.isValid, errors = _c.errors;
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsx)(fuselage_1.FieldGroup, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.resetPasswordForm.fields.email.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldDescription, { children: t('form.resetPasswordForm.content.subtitle') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.EmailInput, __assign({}, register('email', {
                                    validate: validateEmail,
                                    required: true,
                                }), { placeholder: t('form.resetPasswordForm.fields.email.placeholder') })) }), errors.email && (0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.email.message })] }) }) }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.ButtonGroup, __assign({ flexGrow: 1 }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.resetPasswordForm.action.submit') })) })) })] })));
};
exports.default = ResetPasswordForm;
//# sourceMappingURL=ResetPasswordForm.js.map