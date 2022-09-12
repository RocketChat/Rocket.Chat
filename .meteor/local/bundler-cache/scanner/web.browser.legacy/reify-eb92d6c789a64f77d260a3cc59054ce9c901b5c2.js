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
var fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var Form_1 = __importDefault(require("../../common/Form"));
var AdminInfoForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, passwordRulesHint = _a.passwordRulesHint, initialValues = _a.initialValues, validateUsername = _a.validateUsername, validateEmail = _a.validateEmail, validatePassword = _a.validatePassword, _b = _a.keepPosted, keepPosted = _b === void 0 ? false : _b, onSubmit = _a.onSubmit;
    var t = react_i18next_1.useTranslation().t;
    var fullnameField = fuselage_hooks_1.useUniqueId();
    var usernameField = fuselage_hooks_1.useUniqueId(); // lgtm [js/insecure-randomness]
    var emailField = fuselage_hooks_1.useUniqueId();
    var passwordField = fuselage_hooks_1.useUniqueId(); // lgtm [js/insecure-randomness]
    var _c = react_hook_form_1.useForm({
        defaultValues: __assign(__assign({}, initialValues), { password: '' }),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, errors = _d.errors, setFocus = _c.setFocus;
    react_1.useEffect(function () {
        setFocus('fullname');
    }, [setFocus]);
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), jsx_runtime_1.jsx(Form_1.default.Title, { children: t('form.adminInfoForm.title') }, void 0), jsx_runtime_1.jsx(Form_1.default.Subtitle, { children: t('form.adminInfoForm.subtitle') }, void 0), jsx_runtime_1.jsx(Form_1.default.Container, { children: jsx_runtime_1.jsxs(fuselage_1.FieldGroup, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: fullnameField }, { children: t('form.adminInfoForm.fields.fullName.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('fullname', {
                                        required: String(t('component.form.requiredField')),
                                    }), { placeholder: t('form.adminInfoForm.fields.fullName.placeholder'), id: fullnameField }), void 0) }, void 0), errors.fullname && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.fullname.message }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: usernameField }, { children: t('form.adminInfoForm.fields.username.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('username', {
                                        required: String(t('component.form.requiredField')),
                                        validate: validateUsername,
                                    }), { placeholder: t('form.adminInfoForm.fields.username.placeholder'), id: usernameField }), void 0) }, void 0), errors.username && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.username.message }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: emailField }, { children: t('form.adminInfoForm.fields.email.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.EmailInput, __assign({}, register('email', {
                                        required: String(t('component.form.requiredField')),
                                        validate: validateEmail,
                                    }), { placeholder: t('form.adminInfoForm.fields.email.placeholder'), id: emailField }), void 0) }, void 0), errors.email && jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.email.message }, void 0)] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: passwordField }, { children: t('form.adminInfoForm.fields.password.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.PasswordInput, __assign({}, register('password', {
                                        required: String(t('component.form.requiredField')),
                                        validate: validatePassword,
                                    }), { placeholder: t('form.adminInfoForm.fields.password.placeholder'), id: passwordField }), void 0) }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Hint, { children: passwordRulesHint }, void 0), errors.password && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.password.message }, void 0))] }, void 0), keepPosted && (jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ mbe: 'x8', display: 'block', color: 'info', fontScale: 'c1' }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({ id: 'keepPosted', mie: 'x8' }, register('keepPosted')), void 0), jsx_runtime_1.jsx("label", __assign({ htmlFor: 'keepPosted' }, { children: t('form.adminInfoForm.fields.keepPosted.label') }), void 0)] }), void 0))] }, void 0) }, void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsx(fuselage_1.ButtonGroup, __assign({ flexGrow: 1 }, { children: jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting }, { children: t('component.form.action.next') }), void 0) }), void 0) }, void 0)] }), void 0));
};
exports.default = AdminInfoForm;
//# sourceMappingURL=AdminInfoForm.js.map