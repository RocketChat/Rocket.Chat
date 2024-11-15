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
var TotpForm_styles_1 = require("./TotpForm.styles");
var TotpForm = function (_a) {
    var onSubmit = _a.onSubmit, initialValues = _a.initialValues, _b = _a.isBackupCode, isBackupCode = _b === void 0 ? false : _b, onChangeTotpForm = _a.onChangeTotpForm;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _c = (0, react_hook_form_1.useForm)({
        defaultValues: __assign({}, initialValues),
    }), register = _c.register, handleSubmit = _c.handleSubmit, _d = _c.formState, errors = _d.errors, isValidating = _d.isValidating, isSubmitting = _d.isSubmitting;
    return ((0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Container, { children: (0, jsx_runtime_1.jsx)(fuselage_1.FieldGroup, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Field, { children: [isBackupCode ? ((0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.totpForm.fields.backupCode.label') })) : ((0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: t('form.totpForm.fields.totpCode.label') })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: isBackupCode ? ((0, jsx_runtime_1.jsx)(fuselage_1.TextInput, __assign({}, register('backupCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.backupCode.placeholder') }))) : ((0, jsx_runtime_1.jsx)(fuselage_1.NumberInput, __assign({}, register('totpCode', {
                                    required: String(t('component.form.requiredField')),
                                }), { placeholder: t('form.totpForm.fields.totpCode.placeholder') }))) }), errors.backupCode && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.backupCode.message })), errors.totpCode && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: errors.totpCode.message }))] }) }) }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsxs)(TotpForm_styles_1.TotpActionsWrapper, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', disabled: isValidating || isSubmitting, primary: true }, { children: t('form.totpForm.button.text') })), (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ fontScale: 'p2', onClick: onChangeTotpForm }, { children: isBackupCode
                                ? t('form.totpForm.buttonTotpCode.text')
                                : t('form.totpForm.buttonBackupCode.text') }))] }) })] })));
};
exports.default = TotpForm;
//# sourceMappingURL=TotpForm.js.map