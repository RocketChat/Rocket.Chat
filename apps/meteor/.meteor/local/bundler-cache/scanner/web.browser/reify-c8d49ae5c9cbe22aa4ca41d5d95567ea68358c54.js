module.export({Steps:()=>Steps});let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},1);let useState;module.link('react',{useState(v){useState=v}},2);let useForm,FormProvider;module.link('react-hook-form',{useForm(v){useForm=v},FormProvider(v){FormProvider=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);let CopyStep;module.link('./steps/CopyStep',{default(v){CopyStep=v}},5);let PasteStep;module.link('./steps/PasteStep',{default(v){PasteStep=v}},6);var __assign = (this && this.__assign) || function () {
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







var Steps = {
    COPY: 'copy',
    PASTE: 'paste',
};
var RegisterOfflineForm = function (_a) {
    var termsHref = _a.termsHref, policyHref = _a.policyHref, clientKey = _a.clientKey, onSubmit = _a.onSubmit, onCopySecurityCode = _a.onCopySecurityCode, onBackButtonClick = _a.onBackButtonClick;
    var t = useTranslation().t;
    var _b = useState(Steps.COPY), step = _b[0], setStep = _b[1];
    var form = useForm({
        mode: 'onChange',
        defaultValues: {
            token: '',
            agreement: false,
        },
    });
    var handleSubmit = form.handleSubmit;
    return (_jsx(FormProvider, __assign({}, form, { children: _jsxs(Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [_jsx(Form.Header, { children: _jsx(Form.Title, { children: t('form.registerOfflineForm.title') }) }), step === Steps.COPY ? (_jsx(CopyStep, { termsHref: termsHref, policyHref: policyHref, clientKey: clientKey, setStep: setStep, onCopySecurityCode: onCopySecurityCode, onBackButtonClick: onBackButtonClick })) : (_jsx(PasteStep, { setStep: setStep }))] })) })));
};
module.exportDefault(RegisterOfflineForm);
//# sourceMappingURL=RegisterOfflineForm.js.map