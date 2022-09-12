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
var ActionLink_1 = __importDefault(require("../../common/ActionLink"));
var Form_1 = __importDefault(require("../../common/Form"));
var LoginForm_styles_1 = require("./LoginForm.styles");
var LoginForm = function (_a) {
    var onSubmit = _a.onSubmit, initialValues = _a.initialValues, _b = _a.isPasswordLess, isPasswordLess = _b === void 0 ? false : _b, onChangeForm = _a.onChangeForm, onResetPassword = _a.onResetPassword, formError = _a.formError;
    var t = react_i18next_1.useTranslation().t;
    var _c = react_hook_form_1.useForm({
        defaultValues: __assign({}, initialValues),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, errors = _d.errors, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting;
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Subtitle, { children: !isPasswordLess
                    ? t('form.loginForm.content.default')
                    : t('form.loginForm.content.passwordLess') }, void 0), jsx_runtime_1.jsx(Form_1.default.Container, { children: jsx_runtime_1.jsxs(fuselage_1.FieldGroup, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.loginForm.fields.email.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.EmailInput, __assign({}, register('email', {
                                        required: String(t('component.form.requiredField')),
                                    }), { placeholder: t('form.loginForm.fields.email.placeholder') }), void 0) }, void 0), errors.email && jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.email.message }, void 0)] }, void 0), !isPasswordLess && (jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.loginForm.fields.password.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.PasswordInput, __assign({}, register('password', { required: true }), { placeholder: t('form.loginForm.fields.password.placeholder') }), void 0) }, void 0), (formError || errors.password) && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('form.loginForm.fields.password.error') }, void 0))] }, void 0))] }, void 0) }, void 0), jsx_runtime_1.jsxs(Form_1.default.Footer, { children: [jsx_runtime_1.jsxs(LoginForm_styles_1.LoginActionsWrapper, { children: [jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', disabled: isValidating || isSubmitting, primary: true }, { children: isPasswordLess
                                    ? t('form.loginForm.sendLoginLink')
                                    : t('form.loginForm.button.text') }), void 0), !isPasswordLess && (jsx_runtime_1.jsx(ActionLink_1.default, __assign({ fontScale: 'p2', onClick: onChangeForm }, { children: t('form.loginForm.sendLoginLink') }), void 0)), isPasswordLess && (jsx_runtime_1.jsx(ActionLink_1.default, __assign({ fontScale: 'p2', onClick: onChangeForm }, { children: t('form.loginForm.redirect') }), void 0))] }, void 0), !isPasswordLess && (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbs: 'x24', fontScale: 'p2', textAlign: 'left' }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'form.loginForm.resetPassword' }, { children: ["Forgot your password?", jsx_runtime_1.jsx(ActionLink_1.default, __assign({ fontWeight: 400, fontScale: 'p2', onClick: onResetPassword }, { children: "Reset password" }), void 0)] }), void 0) }), void 0))] }, void 0)] }), void 0));
};
exports.default = LoginForm;
//# sourceMappingURL=LoginForm.js.map