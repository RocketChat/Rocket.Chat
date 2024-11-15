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
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var AgreeTermsField = function (_a) {
    var agreementField = _a.agreementField, termsHref = _a.termsHref, policyHref = _a.policyHref, control = _a.control, errors = _a.errors;
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(fuselage_1.Field, __assign({ mbs: '24px' }, { children: [(0, jsx_runtime_1.jsxs)(fuselage_1.FieldRow, { children: [(0, jsx_runtime_1.jsx)(react_hook_form_1.Controller, { name: 'agreement', control: control, rules: {
                            required: String(t('component.form.requiredField')),
                        }, render: function (_a) {
                            var _b = _a.field, ref = _b.ref, name = _b.name, onBlur = _b.onBlur, onChange = _b.onChange, value = _b.value;
                            return ((0, jsx_runtime_1.jsx)(fuselage_1.CheckBox, { ref: ref, id: agreementField, onChange: onChange, onBlur: onBlur, name: name, checked: value, "aria-describedby": "".concat(agreementField, "-error"), "aria-invalid": Boolean(errors.agreement), "aria-required": 'true' }));
                        } }), (0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, __assign({ display: 'inline', htmlFor: agreementField, withRichContent: true, required: true, fontScale: 'c1' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ is: 'a', href: termsHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ is: 'a', href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] }), errors.agreement && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldError, __assign({ "aria-live": 'assertive', id: "".concat(agreementField, "-error") }, { children: t('component.form.requiredField') })))] })));
};
exports.default = AgreeTermsField;
//# sourceMappingURL=AgreeTermsField.js.map