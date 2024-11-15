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
var OrganizationInfoForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, organizationIndustryOptions = _a.organizationIndustryOptions, organizationSizeOptions = _a.organizationSizeOptions, countryOptions = _a.countryOptions, nextStep = _a.nextStep, initialValues = _a.initialValues, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, onClickSkip = _a.onClickSkip;
    var t = (0, react_i18next_1.useTranslation)().t;
    var breakpoints = (0, fuselage_hooks_1.useBreakpoints)();
    var isMobile = !breakpoints.includes('md');
    var formId = (0, fuselage_hooks_1.useUniqueId)();
    var organizationNameField = (0, fuselage_hooks_1.useUniqueId)();
    var organizationIndustryField = (0, fuselage_hooks_1.useUniqueId)();
    var organizationSizeField = (0, fuselage_hooks_1.useUniqueId)();
    var countryField = (0, fuselage_hooks_1.useUniqueId)();
    var organizationInfoFormRef = (0, react_1.useRef)(null);
    var _b = (0, react_hook_form_1.useForm)({
        defaultValues: initialValues,
        mode: 'onBlur',
    }), control = _b.control, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, errors = _c.errors;
    (0, react_1.useEffect)(function () {
        if (organizationInfoFormRef.current) {
            organizationInfoFormRef.current.focus();
        }
    }, []);
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ ref: organizationInfoFormRef, tabIndex: -1, "aria-labelledby": "".concat(formId, "-title"), "aria-describedby": "".concat(formId, "-description"), onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsxs)(layout_1.Form.Header, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Steps, { currentStep: currentStep, stepCount: stepCount }), (0, jsx_runtime_1.jsx)(layout_1.Form.Title, __assign({ id: "".concat(formId, "-title") }, { children: t('form.organizationInfoForm.title') })), (0, jsx_runtime_1.jsx)(layout_1.Form.Subtitle, __assign({ id: "".concat(formId, "-description") }, { children: t('form.organizationInfoForm.subtitle') }))] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: organizationNameField }, { children: t('form.organizationInfoForm.fields.organizationName.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'organizationName', control: control, rules: {
                                            required: String(t('component.form.requiredField')),
                                        }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, field, { placeholder: t('form.organizationInfoForm.fields.organizationName.placeholder'), "aria-describedby": "".concat(organizationNameField, "-error}"), "aria-required": 'true', "aria-invalid": Boolean(errors.organizationName), id: organizationNameField })));
                                        } }) }), errors.organizationName && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(organizationNameField, "-error}") }, { children: t('component.form.requiredField') })))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: organizationIndustryField }, { children: t('form.organizationInfoForm.fields.organizationIndustry.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'organizationIndustry', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.Select, __assign({}, field, { options: organizationIndustryOptions, placeholder: t('form.organizationInfoForm.fields.organizationIndustry.placeholder'), "aria-required": 'true', "aria-invalid": Boolean(errors.organizationIndustry), "aria-describedby": "".concat(organizationIndustryField, "-error}"), id: organizationIndustryField })));
                                        } }) }), errors.organizationIndustry && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(organizationIndustryField, "-error}") }, { children: t('component.form.requiredField') })))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: organizationSizeField }, { children: t('form.organizationInfoForm.fields.organizationSize.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'organizationSize', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.Select, __assign({}, field, { options: organizationSizeOptions, placeholder: t('form.organizationInfoForm.fields.organizationSize.placeholder'), "aria-required": 'true', "aria-invalid": Boolean(errors.organizationSize), "aria-describedby": "".concat(organizationSizeField, "-error}"), id: organizationSizeField })));
                                        } }) }), errors.organizationSize && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(organizationSizeField, "-error}") }, { children: t('component.form.requiredField') })))] }), (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, htmlFor: countryField }, { children: t('form.organizationInfoForm.fields.country.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'country', control: control, rules: { required: String(t('component.form.requiredField')) }, render: function (_a) {
                                            var field = _a.field;
                                            return ((0, jsx_runtime_1.jsx)(fuselage_1.Select, __assign({}, field, { options: countryOptions, placeholder: t('form.organizationInfoForm.fields.country.placeholder'), "aria-required": 'true', "aria-invalid": Boolean(errors.country), "aria-describedby": "".concat(countryField, "-error}"), id: countryField })));
                                        } }) }), errors.country && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(countryField, "-error}") }, { children: t('component.form.requiredField') })))] })] }) }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.ButtonGroup, __assign({ vertical: isMobile, flexGrow: 1 }, { children: [onBackButtonClick && ((0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }))), (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting }, { children: nextStep !== null && nextStep !== void 0 ? nextStep : t('component.form.action.next') })), onClickSkip && ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ withTruncatedText: true, flexGrow: 1 }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.ButtonGroup, __assign({ flexGrow: 1, align: 'end' }, { children: (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ onClick: onClickSkip }, { children: t('component.form.action.skip') })) })) })))] })) })] })));
};
exports.default = OrganizationInfoForm;
//# sourceMappingURL=OrganizationInfoForm.js.map