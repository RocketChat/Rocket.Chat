let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let Box,Button,ButtonGroup,Scrollable;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v},ButtonGroup(v){ButtonGroup=v},Scrollable(v){Scrollable=v}},1);let useBreakpoints;module.link('@rocket.chat/fuselage-hooks',{useBreakpoints(v){useBreakpoints=v}},2);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},3);let useFormContext;module.link('react-hook-form',{useFormContext(v){useFormContext=v}},4);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},5);let Steps;module.link('../RegisterOfflineForm',{Steps(v){Steps=v}},6);var __assign = (this && this.__assign) || function () {
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







var PasteStep = function (_a) {
    var setStep = _a.setStep;
    var t = useTranslation().t;
    var breakpoints = useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var _b = useFormContext(), register = _b.register, _c = _b.formState, isSubmitting = _c.isSubmitting, isValidating = _c.isValidating, isSubmitSuccessful = _c.isSubmitSuccessful;
    return (_jsxs(_Fragment, { children: [_jsxs(Form.Container, { children: [_jsx(Box, __assign({ mbe: '24px', fontScale: 'p2' }, { children: _jsxs(Trans, { children: ["1. In ", _jsx("strong", { children: "cloud.rocket.chat" }), " get the generated text and paste below to complete your registration process"] }, 'form.registerOfflineForm.pasteStep.description') })), _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: 16, flexGrow: 1, backgroundColor: 'dark' }, { children: _jsx(Scrollable, __assign({ vertical: true }, { children: _jsx(Box, __assign({}, register('token', { required: true }), { is: 'textarea', backgroundColor: 'dark', height: 'x108', fontFamily: 'mono', fontScale: 'p2', color: 'white', style: { wordBreak: 'break-all', resize: 'none' }, placeholder: t('component.form.action.pasteHere'), autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: 'false' })) })) }))] }), _jsx(Form.Footer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column' }, { children: _jsxs(ButtonGroup, __assign({ vertical: isMobile }, { children: [_jsx(Button, __assign({ type: 'submit', primary: true, loading: isSubmitting || isValidating, disabled: isSubmitSuccessful }, { children: t('component.form.action.completeRegistration') })), _jsx(Button, __assign({ type: 'button', onClick: function () { return setStep(Steps.COPY); } }, { children: t('component.form.action.back') }))] })) })) })] }));
};
module.exportDefault(PasteStep);
//# sourceMappingURL=PasteStep.js.map