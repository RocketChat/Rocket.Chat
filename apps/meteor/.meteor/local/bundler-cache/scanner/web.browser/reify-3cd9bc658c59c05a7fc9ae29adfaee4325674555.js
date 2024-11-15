let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,CheckBox,Field,FieldError,FieldLabel,FieldRow;module.link('@rocket.chat/fuselage',{Box(v){Box=v},CheckBox(v){CheckBox=v},Field(v){Field=v},FieldError(v){FieldError=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v}},1);let Controller;module.link('react-hook-form',{Controller(v){Controller=v}},2);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},3);var __assign = (this && this.__assign) || function () {
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




var AgreeTermsField = function (_a) {
    var agreementField = _a.agreementField, termsHref = _a.termsHref, policyHref = _a.policyHref, control = _a.control, errors = _a.errors;
    var t = useTranslation().t;
    return (_jsxs(Field, __assign({ mbs: '24px' }, { children: [_jsxs(FieldRow, { children: [_jsx(Controller, { name: 'agreement', control: control, rules: {
                            required: String(t('component.form.requiredField')),
                        }, render: function (_a) {
                            var _b = _a.field, ref = _b.ref, name = _b.name, onBlur = _b.onBlur, onChange = _b.onChange, value = _b.value;
                            return (_jsx(CheckBox, { ref: ref, id: agreementField, onChange: onChange, onBlur: onBlur, name: name, checked: value, "aria-describedby": "".concat(agreementField, "-error"), "aria-invalid": Boolean(errors.agreement), "aria-required": 'true' }));
                        } }), _jsx(FieldLabel, __assign({ display: 'inline', htmlFor: agreementField, withRichContent: true, required: true, fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.form.termsAndConditions' }, { children: ["I agree with", _jsx(Box, __assign({ is: 'a', href: termsHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Terms and Conditions" })), "and", _jsx(Box, __assign({ is: 'a', href: policyHref, target: '_blank', rel: 'noopener noreferrer' }, { children: "Privacy Policy" }))] })) }))] }), errors.agreement && (_jsx(FieldError, __assign({ "aria-live": 'assertive', id: "".concat(agreementField, "-error") }, { children: t('component.form.requiredField') })))] })));
};
module.exportDefault(AgreeTermsField);
//# sourceMappingURL=AgreeTermsField.js.map