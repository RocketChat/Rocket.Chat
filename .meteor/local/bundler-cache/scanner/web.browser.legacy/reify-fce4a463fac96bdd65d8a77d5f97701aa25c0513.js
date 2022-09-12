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
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var Form_1 = __importDefault(require("../../common/Form"));
var NewAccountForm = function (_a) {
    var _b;
    var validateEmail = _a.validateEmail, validatePassword = _a.validatePassword, validateConfirmationPassword = _a.validateConfirmationPassword, onSubmit = _a.onSubmit;
    var t = react_i18next_1.useTranslation().t;
    var _c = react_hook_form_1.useForm({ mode: 'onChange' }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, isValid = _d.isValid, errors = _d.errors, setFocus = _c.setFocus;
    react_1.useEffect(function () {
        setFocus('name');
    }, [setFocus]);
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Container, { children: jsx_runtime_1.jsxs(fuselage_1.FieldGroup, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.newAccountForm.fields.name.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('name', {
                                        required: String(t('component.form.requiredField')),
                                    })), void 0) }, void 0), errors.name && jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.name.message }, void 0)] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.newAccountForm.fields.email.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.EmailInput, __assign({}, register('email', {
                                        validate: validateEmail,
                                        required: true,
                                    })), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.email) && jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.email.message }, void 0)] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.newAccountForm.fields.password.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.PasswordInput, __assign({}, register('password', {
                                        required: true,
                                        validate: validatePassword,
                                    })), void 0) }, void 0), errors.password && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.password.message }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.newAccountForm.fields.confirmPassword.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.PasswordInput, __assign({}, register('confirmPassword', {
                                        required: true,
                                        validate: validateConfirmationPassword,
                                    })), void 0) }, void 0), errors.confirmPassword && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.confirmPassword.message }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsxs(fuselage_1.Field.Row, __assign({ justifyContent: 'flex-start' }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({}, register('agreement', { required: true }), { mie: 'x8' }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", jsx_runtime_1.jsx("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" }), void 0), "and", jsx_runtime_1.jsx("a", __assign({ href: 'https://rocket.chat/policy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Polic" }), void 0)] }), void 0) }), void 0)] }), void 0), ((_b = errors.agreement) === null || _b === void 0 ? void 0 : _b.type) === 'required' && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0)] }, void 0) }, void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsx(fuselage_1.ButtonGroup, __assign({ flexGrow: 1 }, { children: jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.next') }), void 0) }), void 0) }, void 0)] }), void 0));
};
exports.default = NewAccountForm;
//# sourceMappingURL=NewAccountForm.js.map