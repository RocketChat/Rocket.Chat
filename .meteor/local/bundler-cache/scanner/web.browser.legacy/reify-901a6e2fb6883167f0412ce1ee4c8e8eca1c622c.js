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
var List_1 = __importDefault(require("../../common/List"));
var StandaloneServerForm = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount, initialValues = _a.initialValues, onSubmit = _a.onSubmit, onBackButtonClick = _a.onBackButtonClick;
    var t = react_i18next_1.useTranslation().t;
    var form = react_hook_form_1.useForm({
        mode: 'onChange',
        defaultValues: __assign({ registerType: 'standalone' }, initialValues),
    });
    var _b = form.formState, isValidating = _b.isValidating, isSubmitting = _b.isSubmitting, isValid = _b.isValid, handleSubmit = form.handleSubmit;
    return (jsx_runtime_1.jsx(react_hook_form_1.FormProvider, __assign({}, form, { children: jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Steps, { currentStep: currentStep, stepCount: stepCount }, void 0), jsx_runtime_1.jsx(Form_1.default.Title, { children: t('form.standaloneServerForm.title') }, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbe: 'x24', mbs: 'x16' }, { children: jsx_runtime_1.jsxs(List_1.default, { children: [jsx_runtime_1.jsx(List_1.default.Item, __assign({ fontScale: 'c2', icon: 'warning', iconColor: 'warning' }, { children: t('form.standaloneServerForm.servicesUnavailable') }), void 0), jsx_runtime_1.jsx(List_1.default.Item, __assign({ fontScale: 'c1', icon: 'info', iconColor: 'neutral' }, { children: t('form.standaloneServerForm.publishOwnApp') }), void 0), jsx_runtime_1.jsx(List_1.default.Item, __assign({ fontScale: 'c1', icon: 'info', iconColor: 'neutral' }, { children: t('form.standaloneServerForm.manuallyIntegrate') }), void 0)] }, void 0) }), void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsxs(fuselage_1.ButtonGroup, { children: [jsx_runtime_1.jsx(fuselage_1.Button, __assign({ onClick: onBackButtonClick }, { children: t('component.form.action.back') }), void 0), jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isValidating || isSubmitting || !isValid }, { children: t('component.form.action.confirm') }), void 0)] }, void 0) }, void 0)] }), void 0) }), void 0));
};
exports.default = StandaloneServerForm;
//# sourceMappingURL=StandaloneServerForm.js.map