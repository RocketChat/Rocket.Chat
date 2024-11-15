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
var RequestTrialForm = function (_a) {
    var _b;
    var defaultValues = _a.defaultValues, organizationSizeOptions = _a.organizationSizeOptions, countryOptions = _a.countryOptions, onSubmit = _a.onSubmit, validateEmail = _a.validateEmail, _c = _a.termsHref, termsHref = _c === void 0 ? 'https://rocket.chat/terms' : _c, _d = _a.policyHref, policyHref = _d === void 0 ? 'https://rocket.chat/privacy' : _d;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _e = (0, react_hook_form_1.useForm)({ mode: 'onChange' }), handleSubmit = _e.handleSubmit, register = _e.register, control = _e.control, _f = _e.formState, isValidating = _f.isValidating, isSubmitting = _f.isSubmitting, isValid = _f.isValid, errors = _f.errors;
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.requestTrialForm.fields.emailAddress.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.EmailInput, __assign({}, register('email', {
                                    validate: validateEmail,
                                    required: true,
                                }), { placeholder: t('form.requestTrialForm.fields.emailAddress.placeholder'), defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.email, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.email) === null || _b === void 0 ? void 0 : _b.message) || undefined })) }), (errors === null || errors === void 0 ? void 0 : errors.email) && (0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.email.message })] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.requestTrialForm.fields.organizationName.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, register('organizationName', { required: true }), { placeholder: t('form.requestTrialForm.fields.organizationName.placeholder'), defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationName })) }), (errors === null || errors === void 0 ? void 0 : errors.organizationName) && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: t('component.form.requiredField') }))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.requestTrialForm.fields.organizationSize.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'organizationSize', control: control, rules: { required: true }, render: function (_a) {
                                        var _b;
                                        var field = _a.field;
                                        return ((0, jsx_runtime_1.jsx)(fuselage_1.Select, __assign({}, field, { options: organizationSizeOptions, placeholder: t('form.requestTrialForm.fields.organizationSize.placeholder'), error: ((_b = errors === null || errors === void 0 ? void 0 : errors.email) === null || _b === void 0 ? void 0 : _b.message) || undefined })));
                                    }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationSize }) })] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.requestTrialForm.fields.country.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'country', control: control, rules: { required: true }, render: function (_a) {
                                        var field = _a.field;
                                        return ((0, jsx_runtime_1.jsx)(fuselage_1.SelectFiltered, __assign({}, field, { options: countryOptions, width: 'full', placeholder: t('form.requestTrialForm.fields.country.placeholder') })));
                                    }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.country }) })] }), (0, jsx_runtime_1.jsx)(fuselage_1.Field, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Box, __assign({ mbs: 24 }, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Box, __assign({ mbe: 8, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', fontScale: 'c1', lineHeight: 20 }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.CheckBox, __assign({ mie: 8 }, register('updates'))), ' ', (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'updates' }, { children: t('form.registeredServerForm.keepInformed') }))] })), (0, jsx_runtime_1.jsxs)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', color: 'default', fontScale: 'c1', lineHeight: 20 }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.CheckBox, __assign({ mie: 8 }, register('agreement', { required: true }))), ' ', (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", (0, jsx_runtime_1.jsx)("a", __assign({ href: termsHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", (0, jsx_runtime_1.jsx)("a", __assign({ href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] }))] })) }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.requestTrialForm.hasWorkspace.label') }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldDescription, { children: t('form.requestTrialForm.hasWorkspace.description') })] })] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.requestTrialForm.button.text') })) })] })));
};
exports.default = RequestTrialForm;
//# sourceMappingURL=RequestTrialForm.js.map