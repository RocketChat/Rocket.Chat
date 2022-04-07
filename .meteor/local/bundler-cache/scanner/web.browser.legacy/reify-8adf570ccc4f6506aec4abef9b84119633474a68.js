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
var Form_1 = __importDefault(require("../../common/Form"));
var RequestTrialForm = function (_a) {
    var _b;
    var defaultValues = _a.defaultValues, organizationSizeOptions = _a.organizationSizeOptions, countryOptions = _a.countryOptions, onSubmit = _a.onSubmit, validateEmail = _a.validateEmail, _c = _a.termsHref, termsHref = _c === void 0 ? 'https://rocket.chat/terms' : _c, _d = _a.policyHref, policyHref = _d === void 0 ? 'https://rocket.chat/privacy' : _d;
    var t = react_i18next_1.useTranslation().t;
    var _e = react_hook_form_1.useForm({ mode: 'onChange' }), handleSubmit = _e.handleSubmit, register = _e.register, control = _e.control, _f = _e.formState, isValidating = _f.isValidating, isSubmitting = _f.isSubmitting, isValid = _f.isValid, errors = _f.errors;
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsxs(fuselage_1.FieldGroup, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.requestTrialForm.fields.emailAddress.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.EmailInput, __assign({}, register('email', {
                                    validate: validateEmail,
                                    required: true,
                                }), { placeholder: t('form.requestTrialForm.fields.emailAddress.placeholder'), defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.email, error: ((_b = errors === null || errors === void 0 ? void 0 : errors.email) === null || _b === void 0 ? void 0 : _b.message) || undefined }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.email) && jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.email.message }, void 0)] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.requestTrialForm.fields.organizationName.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('organizationName', { required: true }), { placeholder: t('form.requestTrialForm.fields.organizationName.placeholder'), defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationName }), void 0) }, void 0), (errors === null || errors === void 0 ? void 0 : errors.organizationName) && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.requestTrialForm.fields.organizationSize.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'organizationSize', control: control, rules: { required: true }, render: function (_a) {
                                        var _b;
                                        var field = _a.field;
                                        return (jsx_runtime_1.jsx(fuselage_1.Select, __assign({}, field, { options: organizationSizeOptions, placeholder: t('form.requestTrialForm.fields.organizationSize.placeholder'), error: ((_b = errors === null || errors === void 0 ? void 0 : errors.email) === null || _b === void 0 ? void 0 : _b.message) || undefined }), void 0));
                                    }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.organizationSize }, void 0) }, void 0)] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.requestTrialForm.fields.country.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'country', control: control, rules: { required: true }, render: function (_a) {
                                        var field = _a.field;
                                        return (jsx_runtime_1.jsx(fuselage_1.SelectFiltered, __assign({}, field, { options: countryOptions, width: 'full', placeholder: t('form.requestTrialForm.fields.country.placeholder') }), void 0));
                                    }, defaultValue: defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.country }, void 0) }, void 0)] }, void 0), jsx_runtime_1.jsx(fuselage_1.Field, { children: jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ mbs: 'x24' }, { children: [jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ mbe: 'x8', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', fontScale: 'c1', lineHeight: 20 }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({ mie: 'x8' }, register('updates')), void 0), ' ', jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'updates' }, { children: t('form.registeredServerForm.keepInformed') }), void 0)] }), void 0), jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', color: 'default', fontScale: 'c1', lineHeight: 20 }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({ mie: 'x8' }, register('agreement', { required: true })), void 0), ' ', jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", jsx_runtime_1.jsx("a", __assign({ href: termsHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" }), void 0), "and", jsx_runtime_1.jsx("a", __assign({ href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }), void 0)] }), void 0) }), void 0)] }), void 0)] }), void 0) }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.requestTrialForm.hasWorkspace.label') }, void 0), jsx_runtime_1.jsx(fuselage_1.Field.Description, { children: t('form.requestTrialForm.hasWorkspace.description') }, void 0)] }, void 0)] }, void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('form.requestTrialForm.button.text') }), void 0) }, void 0)] }), void 0));
};
exports.default = RequestTrialForm;
//# sourceMappingURL=RequestTrialForm.js.map