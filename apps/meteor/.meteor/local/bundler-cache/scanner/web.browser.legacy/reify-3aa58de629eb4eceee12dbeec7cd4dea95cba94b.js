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
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var NewAccountForm = function (_a) {
    var _b;
    var validateEmail = _a.validateEmail, validatePassword = _a.validatePassword, validateConfirmationPassword = _a.validateConfirmationPassword, onSubmit = _a.onSubmit;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _c = (0, react_hook_form_1.useForm)({ mode: 'onChange' }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, isValid = _d.isValid, errors = _d.errors, setFocus = _c.setFocus;
    (0, react_1.useEffect)(function () {
        setFocus('name');
    }, [setFocus]);
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.newAccountForm.fields.name.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, register('name', {
                                        required: String(t('component.form.requiredField')),
                                    }))) }), errors.name && (0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.name.message })] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.newAccountForm.fields.email.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.EmailInput, __assign({}, register('email', {
                                        validate: validateEmail,
                                        required: true,
                                    }))) }), (errors === null || errors === void 0 ? void 0 : errors.email) && (0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.email.message })] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.newAccountForm.fields.password.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.PasswordInput, __assign({}, register('password', {
                                        required: true,
                                        validate: validatePassword,
                                    }))) }), errors.password && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.password.message }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.newAccountForm.fields.confirmPassword.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.PasswordInput, __assign({}, register('confirmPassword', {
                                        required: true,
                                        validate: validateConfirmationPassword,
                                    }))) }), errors.confirmPassword && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.confirmPassword.message }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.FieldRow, __assign({ justifyContent: 'flex-start' }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.CheckBox, __assign({}, register('agreement', { required: true }), { mie: 8 })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true, fontScale: 'c1' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", (0, jsx_runtime_1.jsx)("a", __assign({ href: 'https://rocket.chat/terms', target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", (0, jsx_runtime_1.jsx)("a", __assign({ href: 'https://rocket.chat/privacy', target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] })), ((_b = errors.agreement) === null || _b === void 0 ? void 0 : _b.type) === 'required' && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: t('component.form.requiredField') }))] })] }) }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.ButtonGroup, __assign({ flexGrow: 1 }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.next') })) })) })] })));
};
exports.default = NewAccountForm;
//# sourceMappingURL=NewAccountForm.js.map