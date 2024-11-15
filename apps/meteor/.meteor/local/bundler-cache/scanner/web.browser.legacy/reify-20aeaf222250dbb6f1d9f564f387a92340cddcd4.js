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
var layout_1 = require("@rocket.chat/layout");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var AgreeTermsField_1 = __importDefault(require("../../common/AgreeTermsField"));
var RegisterServerForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, initialValues = _a.initialValues, validateEmail = _a.validateEmail, offline = _a.offline, onSubmit = _a.onSubmit, _b = _a.termsHref, termsHref = _b === void 0 ? 'https://rocket.chat/terms' : _b, _c = _a.policyHref, policyHref = _c === void 0 ? 'https://rocket.chat/privacy' : _c, onClickRegisterOffline = _a.onClickRegisterOffline;
    var t = (0, react_i18next_1.useTranslation)().t;
    var formId = (0, fuselage_hooks_1.useUniqueId)();
    var emailField = (0, fuselage_hooks_1.useUniqueId)();
    var agreementField = (0, fuselage_hooks_1.useUniqueId)();
    var registerServerFormRef = (0, react_1.useRef)(null);
    var breakpoints = (0, fuselage_hooks_1.useBreakpoints)();
    var isMobile = !breakpoints.includes('md');
    var form = (0, react_hook_form_1.useForm)({
        mode: 'onBlur',
        defaultValues: __assign({ email: '', agreement: false, updates: true }, initialValues),
    });
    var control = form.control, register = form.register, _d = form.formState, isSubmitting = _d.isSubmitting, isValidating = _d.isValidating, errors = _d.errors, handleSubmit = form.handleSubmit;
    (0, react_1.useEffect)(function () {
        if (registerServerFormRef.current) {
            registerServerFormRef.current.focus();
        }
    }, []);
    return ((0, jsx_runtime_1.jsx)(react_hook_form_1.FormProvider, __assign({}, form, { children: (0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ ref: registerServerFormRef, tabIndex: -1, "aria-labelledby": "".concat(formId, "-title"), "aria-describedby": "".concat(formId, "-informed-disclaimer ").concat(formId, "-engagement-disclaimer"), onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsxs)(layout_1.Form.Header, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Steps, { currentStep: currentStep, stepCount: stepCount }), (0, jsx_runtime_1.jsx)(layout_1.Form.Title, __assign({ id: "".concat(formId, "-title") }, { children: t('form.registeredServerForm.title') }))] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.FieldGroup, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ required: true, display: 'flex', alignItems: 'center', htmlFor: emailField }, { children: t('form.registeredServerForm.fields.accountEmail.inputLabel') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: (0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'email', control: control, rules: {
                                                required: String(t('component.form.requiredField')),
                                                validate: validateEmail,
                                            }, render: function (_a) {
                                                var field = _a.field;
                                                return ((0, jsx_runtime_1.jsx)(fuselage_1.EmailInput, __assign({}, field, { "aria-invalid": Boolean(errors.email), "aria-required": 'true', "aria-describedby": "".concat(emailField, "-error"), placeholder: t('form.registeredServerForm.fields.accountEmail.inputPlaceholder'), id: emailField })));
                                            } }) }), errors.email && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(emailField, "-error") }, { children: t('component.form.requiredField') })))] }), (0, jsx_runtime_1.jsx)(AgreeTermsField_1.default, { agreementField: agreementField, termsHref: termsHref, policyHref: policyHref, control: control, errors: errors }), (0, jsx_runtime_1.jsx)("input", __assign({ type: 'hidden' }, register('updates')))] }) }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.ButtonGroup, __assign({ vertical: isMobile, flexGrow: 1 }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isSubmitting || isValidating || offline }, { children: t('component.form.action.registerWorkspace') })), offline && ((0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'button', disabled: !offline, onClick: onClickRegisterOffline }, { children: t('component.form.action.registerOffline') })))] })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ id: "".concat(formId, "-engagement-disclaimer"), mbs: 24, fontScale: 'c1' }, { children: t('form.registeredServerForm.registrationEngagement') })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ id: "".concat(formId, "-informed-disclaimer"), mbs: 24, fontScale: 'c1' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'form.registeredServerForm.registrationKeepInformed' }, { children: ["By submitting this form you consent to receive more information about Rocket.Chat products, events and updates, according to our", (0, jsx_runtime_1.jsx)("a", __assign({ href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" })), ". You may unsubscribe at any time."] })) }))] })) })] })) })));
};
exports.default = RegisterServerForm;
//# sourceMappingURL=RegisterServerForm.js.map