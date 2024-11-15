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
var fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
var layout_1 = require("@rocket.chat/layout");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var AdminInfoForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, passwordRulesHint = _a.passwordRulesHint, initialValues = _a.initialValues, validateUsername = _a.validateUsername, validateEmail = _a.validateEmail, validatePassword = _a.validatePassword, _b = _a.keepPosted, keepPosted = _b === void 0 ? false : _b, onSubmit = _a.onSubmit;
    var t = (0, react_i18next_1.useTranslation)().t;
    var formId = (0, fuselage_hooks_1.useUniqueId)();
    var fullnameField = (0, fuselage_hooks_1.useUniqueId)();
    var usernameField = (0, fuselage_hooks_1.useUniqueId)(); // lgtm [js/insecure-randomness]
    var emailField = (0, fuselage_hooks_1.useUniqueId)();
    var passwordField = (0, fuselage_hooks_1.useUniqueId)(); // lgtm [js/insecure-randomness]
    var adminInfoFormRef = (0, react_1.useRef)(null);
    var _c = (0, react_hook_form_1.useForm)({
        defaultValues: __assign(__assign({}, initialValues), { password: '' }),
        mode: 'onBlur',
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, errors = _d.errors, control = _c.control;
    (0, react_1.useEffect)(function () {
        if (adminInfoFormRef.current) {
            adminInfoFormRef.current.focus();
        }
    }, []);
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ ref: adminInfoFormRef, tabIndex: -1, "aria-labelledby": "".concat(formId, "-title"), "aria-describedby": "".concat(formId, "-description"), onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsxs)(layout_1.Form.Header, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Steps, { currentStep: currentStep, stepCount: stepCount }), (0, jsx_runtime_1.jsx)(layout_1.Form.Title, __assign({ id: "".concat(formId, "-title") }, { children: t('form.adminInfoForm.title') })), (0, jsx_runtime_1.jsx)(layout_1.Form.Subtitle, __assign({ id: "".concat(formId, "-description") }, { children: t('form.adminInfoForm.subtitle') }))] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: fullnameField }, { children: t('form.adminInfoForm.fields.fullName.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'fullname', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, field, { "aria-describedby": "".concat(fullnameField, "-error}"), "aria-required": 'true', "aria-invalid": Boolean(errors.fullname), placeholder: t('form.adminInfoForm.fields.fullName.placeholder'), id: fullnameField })));
                                        } }) }), errors.fullname && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(fullnameField, "-error}") }, { children: errors.fullname.message })))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: usernameField }, { children: t('form.adminInfoForm.fields.username.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'username', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                            validate: validateUsername,
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, field, { "aria-describedby": "".concat(usernameField, "-error}"), "aria-required": 'true', "aria-invalid": Boolean(errors.username), placeholder: t('form.adminInfoForm.fields.username.placeholder'), id: usernameField })));
                                        } }) }), errors.username && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(usernameField, "-error}") }, { children: errors.username.message })))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: emailField }, { children: t('form.adminInfoForm.fields.email.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'email', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                            validate: validateEmail,
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.EmailInput, __assign({}, field, { "aria-required": 'true', "aria-invalid": Boolean(errors.email), "aria-describedby": "".concat(emailField, "-error}"), placeholder: t('form.adminInfoForm.fields.email.placeholder'), id: emailField })));
                                        } }) }), errors.email && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(emailField, "-error}") }, { children: errors.email.message })))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: passwordField }, { children: t('form.adminInfoForm.fields.password.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'password', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                            validate: validatePassword,
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.PasswordInput, __assign({}, field, { "aria-required": 'true', "aria-invalid": Boolean(errors.password), "aria-describedby": "".concat(passwordField, "-hint ").concat(passwordField, "-error}"), placeholder: t('form.adminInfoForm.fields.password.placeholder'), id: passwordField })));
                                        } }) }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldHint, __assign({ id: "".concat(passwordField, "-hint") }, { children: passwordRulesHint })), errors.password && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(passwordField, "-error}") }, { children: errors.password.message })))] }), keepPosted && ((0, jsx_runtime_1.jsxs)(fuselage_1.Box, __assign({ mbe: 8, display: 'block', color: 'info', fontScale: 'c1' }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.CheckBox, __assign({ id: 'keepPosted', mie: 8 }, register('keepPosted'))), (0, jsx_runtime_1.jsx)("label", __assign({ htmlFor: 'keepPosted' }, { children: t('form.adminInfoForm.fields.keepPosted.label') }))] })))] }) }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.ButtonGroup, __assign({ flexGrow: 1 }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting }, { children: t('component.form.action.next') })) })) })] })));
};
exports.default = AdminInfoForm;
//# sourceMappingURL=AdminInfoForm.js.map