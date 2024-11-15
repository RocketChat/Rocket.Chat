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
var LoginForm_styles_1 = require("./LoginForm.styles");
var LoginForm = function (_a) {
    var onSubmit = _a.onSubmit, initialValues = _a.initialValues, _b = _a.isPasswordLess, isPasswordLess = _b === void 0 ? false : _b, onChangeForm = _a.onChangeForm, onResetPassword = _a.onResetPassword, formError = _a.formError;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _c = (0, react_hook_form_1.useForm)({
        defaultValues: __assign({}, initialValues),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, errors = _d.errors, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, isDirty = _d.isDirty;
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsxs)(layout_1.Form.Header, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Title, { children: t('form.loginForm.content.logIn') }), (0, jsx_runtime_1.jsx)(layout_1.Form.Subtitle, { children: !isPasswordLess
                            ? t('form.loginForm.content.default')
                            : t('form.loginForm.content.passwordLess') })] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.loginForm.fields.email.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.EmailInput, __assign({}, register('email', {
                                        required: String(t('component.form.requiredField')),
                                    }), { placeholder: t('form.loginForm.fields.email.placeholder') })) }), errors.email && (0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.email.message })] }), !isPasswordLess && ((0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.loginForm.fields.password.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.PasswordInput, __assign({}, register('password', { required: true }), { placeholder: t('form.loginForm.fields.password.placeholder') })) }), (formError || errors.password) && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: t('form.loginForm.fields.password.error') }))] }))] }) }), (0, jsx_runtime_1.jsxs)(layout_1.Form.Footer, { children: [(0, jsx_runtime_1.jsxs)(LoginForm_styles_1.LoginActionsWrapper, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', disabled: !isDirty || isValidating || isSubmitting, primary: true }, { children: isPasswordLess
                                    ? t('form.loginForm.sendLoginLink')
                                    : t('form.loginForm.button.text') })), !isPasswordLess && ((0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ fontScale: 'p2', onClick: onChangeForm }, { children: t('form.loginForm.sendLoginLink') }))), isPasswordLess && ((0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ fontScale: 'p2', onClick: onChangeForm }, { children: t('form.loginForm.redirect') })))] }), !isPasswordLess && ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ mbs: 24, fontScale: 'p2', textAlign: 'left' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'form.loginForm.resetPassword' }, { children: ["Forgot your password?", (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ fontScale: 'p2', onClick: onResetPassword }, { children: "Reset password" }))] })) })))] })] })));
};
exports.default = LoginForm;
//# sourceMappingURL=LoginForm.js.map