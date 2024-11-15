let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let Box,Button,ButtonGroup,Scrollable;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v},ButtonGroup(v){ButtonGroup=v},Scrollable(v){Scrollable=v}},1);let useBreakpoints,useClipboard,useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useBreakpoints(v){useBreakpoints=v},useClipboard(v){useClipboard=v},useUniqueId(v){useUniqueId=v}},2);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},3);let useFormContext;module.link('react-hook-form',{useFormContext(v){useFormContext=v}},4);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},5);let AgreeTermsField;module.link('../../../common/AgreeTermsField',{default(v){AgreeTermsField=v}},6);let Steps;module.link('../RegisterOfflineForm',{Steps(v){Steps=v}},7);var __assign = (this && this.__assign) || function () {
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








var CopyStep = function (_a) {
    var _b = _a.termsHref, termsHref = _b === void 0 ? 'https://rocket.chat/terms' : _b, _c = _a.policyHref, policyHref = _c === void 0 ? 'https://rocket.chat/privacy' : _c, clientKey = _a.clientKey, setStep = _a.setStep, onCopySecurityCode = _a.onCopySecurityCode, onBackButtonClick = _a.onBackButtonClick;
    var t = useTranslation().t;
    var agreementField = useUniqueId();
    var breakpoints = useBreakpoints();
    var isMobile = !breakpoints.includes('md');
    var _d = useFormContext(), control = _d.control, _e = _d.formState, isValid = _e.isValid, errors = _e.errors;
    var clipboard = useClipboard(clientKey);
    return (_jsxs(_Fragment, { children: [_jsxs(Form.Container, { children: [_jsx(Box, __assign({ mbe: '24px', fontScale: 'p2' }, { children: _jsxs(Trans, { children: ["If for any reason your workspace can\u2019t be connected to the internet, follow these steps:", _jsx(Box, { mbe: '24px' }), "1. Go to: ", _jsx("strong", { children: 'cloud.rocket.chat > Workspaces' }), " and click \u201C", _jsx("strong", { children: "Register self-managed" }), "\u201D", _jsx("br", {}), "2. Click \u201C", _jsx("strong", { children: "Continue offline" }), "\u201D", _jsx("br", {}), "3. In the ", _jsx("strong", { children: "Register offline workspace" }), " dialog in cloud.rocket.chat, paste the token in the box below"] }, 'form.registerOfflineForm.copyStep.description') })), _jsxs(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: 16, flexGrow: 1, backgroundColor: 'dark' }, { children: [_jsx(Scrollable, __assign({ vertical: true }, { children: _jsx(Box, __assign({ height: 'x108', fontFamily: 'mono', fontScale: 'p2', color: 'white', style: { wordBreak: 'break-all' } }, { children: clientKey })) })), _jsx(Button, { icon: 'copy', primary: true, onClick: function () {
                                    onCopySecurityCode();
                                    clipboard.copy();
                                } })] })), _jsx(AgreeTermsField, { agreementField: agreementField, termsHref: termsHref, policyHref: policyHref, control: control, errors: errors })] }), _jsx(Form.Footer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column' }, { children: _jsxs(ButtonGroup, __assign({ vertical: isMobile }, { children: [_jsx(Button, __assign({ type: 'button', primary: true, disabled: !isValid, onClick: function () {
                                    setStep(Steps.PASTE);
                                } }, { children: t('component.form.action.next') })), _jsx(Button, __assign({ type: 'button', onClick: onBackButtonClick }, { children: t('component.form.action.back') }))] })) })) })] }));
};
module.exportDefault(CopyStep);
//# sourceMappingURL=CopyStep.js.map