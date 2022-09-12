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
var ActionLink_1 = __importDefault(require("../../common/ActionLink"));
var Form_1 = __importDefault(require("../../common/Form"));
var TotpForm_styles_1 = require("./TotpForm.styles");
var TotpForm = function (_a) {
    var onSubmit = _a.onSubmit, initialValues = _a.initialValues, _b = _a.isBackupCode, isBackupCode = _b === void 0 ? false : _b, onChangeTotpForm = _a.onChangeTotpForm;
    var t = react_i18next_1.useTranslation().t;
    var _c = react_hook_form_1.useForm({
        defaultValues: __assign({}, initialValues),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, errors = _d.errors, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting;
    return (jsx_runtime_1.jsxs(Form_1.default, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [jsx_runtime_1.jsx(Form_1.default.Container, { children: jsx_runtime_1.jsx(fuselage_1.FieldGroup, { children: jsx_runtime_1.jsxs(fuselage_1.Field, { children: [isBackupCode ? (jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.totpForm.fields.backupCode.label') }, void 0)) : (jsx_runtime_1.jsx(fuselage_1.Field.Label, { children: t('form.totpForm.fields.totpCode.label') }, void 0)), jsx_runtime_1.jsx(fuselage_1.Field.Row, { children: isBackupCode ? (jsx_runtime_1.jsx(fuselage_1.TextInput, __assign({}, register('backupCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.backupCode.placeholder') }), void 0)) : (jsx_runtime_1.jsx(fuselage_1.NumberInput, __assign({}, register('totpCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.totpCode.placeholder') }), void 0)) }, void 0), errors.backupCode && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.backupCode.message }, void 0)), errors.totpCode && (jsx_runtime_1.jsx(fuselage_1.Field.Error, { children: errors.totpCode.message }, void 0))] }, void 0) }, void 0) }, void 0), jsx_runtime_1.jsx(Form_1.default.Footer, { children: jsx_runtime_1.jsxs(TotpForm_styles_1.TotpActionsWrapper, { children: [jsx_runtime_1.jsx(fuselage_1.Button, __assign({ type: 'submit', disabled: isValidating || isSubmitting, primary: true }, { children: t('form.totpForm.button.text') }), void 0), jsx_runtime_1.jsx(ActionLink_1.default, __assign({ fontScale: 'p2', onClick: onChangeTotpForm }, { children: isBackupCode
                                ? t('form.totpForm.buttonTotpCode.text')
                                : t('form.totpForm.buttonBackupCode.text') }), void 0)] }, void 0) }, void 0)] }), void 0));
};
exports.default = TotpForm;
//# sourceMappingURL=TotpForm.js.map