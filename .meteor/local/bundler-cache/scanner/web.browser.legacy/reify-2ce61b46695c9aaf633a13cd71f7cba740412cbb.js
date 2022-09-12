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
var ActionLink_1 = __importDefault(require("../../common/ActionLink"));
var Form_1 = __importDefault(require("../../common/Form"));
var OrganizationInfoForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, organizationTypeOptions = _a.organizationTypeOptions, organizationIndustryOptions = _a.organizationIndustryOptions, organizationSizeOptions = _a.organizationSizeOptions, countryOptions = _a.countryOptions, nextStep = _a.nextStep, initialValues = _a.initialValues, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, onClickSkip = _a.onClickSkip;
    var t = react_i18next_1.useTranslation().t;
    var breakpoints = fuselage_hooks_1.useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var organizationNameField = fuselage_hooks_1.useUniqueId();
    var organizationTypeField = fuselage_hooks_1.useUniqueId();
    var organizationIndustryField = fuselage_hooks_1.useUniqueId();
    var organizationSizeField = fuselage_hooks_1.useUniqueId();
    var countryField = fuselage_hooks_1.useUniqueId();
    var _b = react_hook_form_1.useForm({
        defaultValues: initialValues,
    }), register = _b.register, control = _b.control, handleSubmit = _b.handleSubmit, _c = _b.formState, isValidating = _c.isValidating, isSubmitting = _c.isSubmitting, errors = _c.errors, setFocus = _b.setFocus;
    react_1.useEffect(function () {
        setFocus('organizationName');
    }, [setFocus]);
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), jsx_runtime_1.jsx(Form_1.default.Title, { children: t('form.organizationInfoForm.title') }, void 0), jsx_runtime_1.jsx(Form_1.default.Subtitle, { children: t('form.organizationInfoForm.subtitle') }, void 0), jsx_runtime_1.jsx(Form_1.default.Container, { children: jsx_runtime_1.jsxs(fuselage_1.FieldGroup, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: organizationNameField }, { children: t('form.organizationInfoForm.fields.organizationName.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('organizationName', { required: true }), { placeholder: t('form.organizationInfoForm.fields.organizationName.placeholder'), id: organizationNameField }), void 0) }, void 0), errors.organizationName && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: organizationTypeField }, { children: t('form.organizationInfoForm.fields.organizationType.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'organizationType', control: control, render: function (_a) {
                                            var field = _a.field;
                                            return (jsx_runtime_1.jsx(fuselage_1.Select, __assign({}, field, { options: organizationTypeOptions, placeholder: t('form.organizationInfoForm.fields.organizationType.placeholder'), id: organizationTypeField }), void 0));
                                        } }, void 0) }, void 0)] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: organizationIndustryField }, { children: t('form.organizationInfoForm.fields.organizationIndustry.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'organizationIndustry', control: control, rules: { required: true }, render: function (_a) {
                                            var field = _a.field;
                                            return (jsx_runtime_1.jsx(fuselage_1.Select, __assign({}, field, { options: organizationIndustryOptions, placeholder: t('form.organizationInfoForm.fields.organizationIndustry.placeholder'), id: organizationIndustryField }), void 0));
                                        } }, void 0) }, void 0), errors.organizationIndustry && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: organizationSizeField }, { children: t('form.organizationInfoForm.fields.organizationSize.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'organizationSize', control: control, rules: { required: true }, render: function (_a) {
                                            var field = _a.field;
                                            return (jsx_runtime_1.jsx(fuselage_1.Select, __assign({}, field, { options: organizationSizeOptions, placeholder: t('form.organizationInfoForm.fields.organizationSize.placeholder'), id: organizationSizeField }), void 0));
                                        } }, void 0) }, void 0), errors.organizationSize && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsx(fuselage_1.Field.Label, __assign({ htmlFor: countryField }, { children: t('form.organizationInfoForm.fields.country.label') }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(react_hook_form_1.Controller, { name: 'country', control: control, rules: { required: true }, render: function (_a) {
                                            var field = _a.field;
                                            return (jsx_runtime_1.jsx(fuselage_1.SelectFiltered, __assign({}, field, { options: countryOptions, placeholder: t('form.organizationInfoForm.fields.country.placeholder'), id: countryField }), void 0));
                                        } }, void 0) }, void 0), errors.country && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0)] }, void 0) }, void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsxs(fuselage_1.ButtonGroup, __assign({ vertical: isMobile, flexGrow: 1 }, { children: [onBackButtonClick && (jsx_runtime_1.jsx(fuselage_1.Button, __assign({ disabled: isSubmitting, onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0)), jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting }, { children: nextStep !== null && nextStep !== void 0 ? nextStep : t('component.form.action.next') }), void 0), onClickSkip && (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ withTruncatedText: true, flexGrow: 1 }, { children: jsx_runtime_1.jsx(fuselage_1.ButtonGroup, __assign({ flexGrow: 1, align: 'end' }, { children: jsx_runtime_1.jsx(ActionLink_1.default, __assign({ onClick: onClickSkip }, { children: t('component.form.action.skip') }), void 0) }), void 0) }), void 0))] }), void 0) }, void 0)] }), void 0));
};
exports.default = OrganizationInfoForm;
//# sourceMappingURL=OrganizationInfoForm.js.map