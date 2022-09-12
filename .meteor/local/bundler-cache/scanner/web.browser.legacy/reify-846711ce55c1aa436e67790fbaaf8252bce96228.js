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
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var ActionLink_1 = __importDefault(require("../../common/ActionLink"));
var Form_1 = __importDefault(require("../../common/Form"));
var List_1 = __importDefault(require("../../common/List"));
var RegisterServerForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, initialValues = _a.initialValues, validateEmail = _a.validateEmail, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick, onClickContinue = _a.onClickContinue, _b = _a.termsHref, termsHref = _b === void 0 ? 'https://rocket.chat/terms' : _b, _c = _a.policyHref, policyHref = _c === void 0 ? 'https://rocket.chat/privacy' : _c;
    var t = react_i18next_1.useTranslation().t;
    var emailField = fuselage_hooks_1.useUniqueId();
    var breakpoints = fuselage_hooks_1.useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var form = react_hook_form_1.useForm({
        mode: 'onChange',
        defaultValues: __assign({ email: '', registerType: 'registered', agreement: false, updates: true }, initialValues),
    });
    var register = form.register, _d = form.formState, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting, isValid = _d.isValid, errors = _d.errors, handleSubmit = form.handleSubmit;
    return (jsx_runtime_1.jsx(react_hook_form_1.FormProvider, __assign({}, form, { children: jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), jsx_runtime_1.jsx(Form_1.default.Title, { children: t('form.registeredServerForm.title') }, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbe: 'x24', mbs: 'x16' }, { children: jsx_runtime_1.jsxs(List_1.default, { children: [jsx_runtime_1.jsx(List_1.default.Item, __assign({ fontScale: 'p2', icon: 'check' }, { children: t('form.registeredServerForm.included.push') }), void 0), jsx_runtime_1.jsx(List_1.default.Item, __assign({ fontScale: 'p2', icon: 'check' }, { children: t('form.registeredServerForm.included.externalProviders') }), void 0), jsx_runtime_1.jsx(List_1.default.Item, __assign({ fontScale: 'p2', icon: 'check' }, { children: t('form.registeredServerForm.included.apps') }), void 0)] }, void 0) }), void 0), jsx_runtime_1.jsxs(Form_1.default.Container, { children: [jsx_runtime_1.jsxs(fuselage_1.Field, { children: [jsx_runtime_1.jsxs(fuselage_1.Field.Label, __assign({ display: 'flex', alignItems: 'center', htmlFor: emailField }, { children: [t('form.registeredServerForm.fields.accountEmail.inputLabel'), jsx_runtime_1.jsx(fuselage_1.Icon, { title: t('form.registeredServerForm.fields.accountEmail.tooltipLabel'), mis: 'x4', size: 'x16', name: 'info' }, void 0)] }), void 0), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: jsx_runtime_1.jsx(fuselage_1.EmailInput, __assign({}, register('email', {
                                        required: true,
                                        validate: validateEmail,
                                    }), { placeholder: t('form.registeredServerForm.fields.accountEmail.inputPlaceholder'), id: emailField }), void 0) }, void 0), errors.email && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: t('component.form.requiredField') }, void 0))] }, void 0), jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ mbs: 'x24' }, { children: [jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ mbe: 'x8', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', fontScale: 'c1', lineHeight: 20 }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({ mie: 'x8' }, register('updates')), void 0), ' ', jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'updates' }, { children: t('form.registeredServerForm.keepInformed') }), void 0)] }), void 0), jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', color: 'default', fontScale: 'c1', lineHeight: 20 }, { children: [jsx_runtime_1.jsx(fuselage_1.CheckBox, __assign({ mie: 'x8' }, register('agreement', { required: true })), void 0), ' ', jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'label', htmlFor: 'agreement', withRichContent: true }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", jsx_runtime_1.jsx("a", __assign({ href: termsHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" }), void 0), "and", jsx_runtime_1.jsx("a", __assign({ href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }), void 0)] }), void 0) }), void 0)] }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbs: 'x32', fontScale: 'c1', htmlFor: 'agreement', withRichContent: true }, { children: t('form.registeredServerForm.agreeToReceiveUpdates') }), void 0)] }), void 0)] }, void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsxs(fuselage_1.ButtonGroup, __assign({ vertical: isMobile }, { children: [jsx_runtime_1.jsx(fuselage_1.Button, __assign({ onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0), jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.register') }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ withTruncatedText: true, flexGrow: 1 }, { children: jsx_runtime_1.jsx(fuselage_1.ButtonGroup, __assign({ flexGrow: 1, align: 'end' }, { children: jsx_runtime_1.jsx(ActionLink_1.default, __assign({ onClick: onClickContinue }, { children: t('form.registeredServerForm.continueStandalone') }), void 0) }), void 0) }), void 0)] }), void 0) }, void 0)] }), void 0) }), void 0));
};
exports.default = RegisterServerForm;
//# sourceMappingURL=RegisteredServerForm.js.map