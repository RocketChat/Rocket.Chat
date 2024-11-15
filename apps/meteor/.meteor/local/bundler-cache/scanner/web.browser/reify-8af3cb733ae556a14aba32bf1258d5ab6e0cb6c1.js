module.export({CustomFieldsForm:()=>CustomFieldsForm},true);let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let Field,FieldLabel,FieldRow,FieldError,Select,TextInput;module.link('@rocket.chat/fuselage',{Field(v){Field=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v},Select(v){Select=v},TextInput(v){TextInput=v}},1);let useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v}},2);let useCallback,useMemo;module.link('react',{useCallback(v){useCallback=v},useMemo(v){useMemo=v}},3);let Controller,useFormState,get;module.link('react-hook-form',{Controller(v){Controller=v},useFormState(v){useFormState=v},get(v){get=v}},4);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},5);var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};






const FIELD_TYPES = {
    select: Select,
    text: TextInput,
};
const CustomField = (_a) => {
    var _b;
    var { name, type, control, label, required, defaultValue, options = [] } = _a, props = __rest(_a, ["name", "type", "control", "label", "required", "defaultValue", "options"]);
    const { t } = useTranslation();
    const { errors } = useFormState({ control });
    const fieldId = useUniqueId();
    const Component = (_b = FIELD_TYPES[type]) !== null && _b !== void 0 ? _b : null;
    const selectOptions = useMemo(() => options.length > 0 && options[0] instanceof Array ? options : options.map((option) => [option, option, defaultValue === option]), [defaultValue, options]);
    const validateRequired = useCallback((value) => (required ? typeof value === 'string' && !!value.trim() : true), [required]);
    const getErrorMessage = useCallback((error) => {
        switch (error === null || error === void 0 ? void 0 : error.type) {
            case 'required':
                return t('Required_field', { field: label || name });
            case 'minLength':
                return t('Min_length_is', { postProcess: 'sprintf', sprintf: [props === null || props === void 0 ? void 0 : props.minLength] });
            case 'maxLength':
                return t('Max_length_is', { postProcess: 'sprintf', sprintf: [props === null || props === void 0 ? void 0 : props.maxLength] });
        }
    }, [label, name, props === null || props === void 0 ? void 0 : props.maxLength, props === null || props === void 0 ? void 0 : props.minLength, t]);
    const error = get(errors, name);
    const errorMessage = useMemo(() => getErrorMessage(error), [error, getErrorMessage]);
    return (_jsx(Controller, { name: name, control: control, defaultValue: defaultValue !== null && defaultValue !== void 0 ? defaultValue : '', rules: { minLength: props.minLength, maxLength: props.maxLength, validate: { required: validateRequired } }, render: ({ field }) => (_jsxs(Field, { "rcx-field-group__item": true, children: [_jsx(FieldLabel, { htmlFor: fieldId, required: required, children: label || t(name) }), _jsx(FieldRow, { children: _jsx(Component, Object.assign({}, props, field, { id: fieldId, "aria-describedby": `${fieldId}-error`, error: errorMessage, options: selectOptions, flexGrow: 1 })) }), _jsx(FieldError, { "aria-live": 'assertive', id: `${fieldId}-error`, children: errorMessage })] })) }));
};
// eslint-disable-next-line react/no-multi-comp
const CustomFieldsForm = ({ formName, formControl, metadata }) => (_jsx(_Fragment, { children: metadata.map((_a) => {
        var _b;
        var { name: fieldName } = _a, props = __rest(_a, ["name"]);
        props.label = (_b = props.label) !== null && _b !== void 0 ? _b : fieldName;
        return _jsx(CustomField, Object.assign({ name: `${formName}.${fieldName}`, control: formControl }, props), fieldName);
    }) }));
//# sourceMappingURL=CustomFieldsForm.js.map