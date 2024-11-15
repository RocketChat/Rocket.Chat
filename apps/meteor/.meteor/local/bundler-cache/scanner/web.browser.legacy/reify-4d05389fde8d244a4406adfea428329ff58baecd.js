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
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var AgreeTermsField_1 = __importDefault(require("../../../common/AgreeTermsField"));
var RegisterOfflineForm_1 = require("../RegisterOfflineForm");
var CopyStep = function (_a) {
    var _b = _a.termsHref, termsHref = _b === void 0 ? 'https://rocket.chat/terms' : _b, _c = _a.policyHref, policyHref = _c === void 0 ? 'https://rocket.chat/privacy' : _c, clientKey = _a.clientKey, setStep = _a.setStep, onCopySecurityCode = _a.onCopySecurityCode, onBackButtonClick = _a.onBackButtonClick;
    var t = (0, react_i18next_1.useTranslation)().t;
    var agreementField = (0, fuselage_hooks_1.useUniqueId)();
    var breakpoints = (0, fuselage_hooks_1.useBreakpoints)();
    var isMobile = !breakpoints.includes('md');
    var _d = (0, react_hook_form_1.useFormContext)(), control = _d.control, _e = _d.formState, isValid = _e.isValid, errors = _e.errors;
    var clipboard = (0, fuselage_hooks_1.useClipboard)(clientKey);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(layout_1.Form.Container, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ mbe: '24px', fontScale: 'p2' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, { children: ["If for any reason your workspace can\u2019t be connected to the internet, follow these steps:", (0, jsx_runtime_1.jsx)(fuselage_1.Box, { mbe: '24px' }), "1. Go to: ", (0, jsx_runtime_1.jsx)("strong", { children: 'cloud.rocket.chat > Workspaces' }), " and click \u201C", (0, jsx_runtime_1.jsx)("strong", { children: "Register self-managed" }), "\u201D", (0, jsx_runtime_1.jsx)("br", {}), "2. Click \u201C", (0, jsx_runtime_1.jsx)("strong", { children: "Continue offline" }), "\u201D", (0, jsx_runtime_1.jsx)("br", {}), "3. In the ", (0, jsx_runtime_1.jsx)("strong", { children: "Register offline workspace" }), " dialog in cloud.rocket.chat, paste the token in the box below"] }, 'form.registerOfflineForm.copyStep.description') })), (0, jsx_runtime_1.jsxs)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: 16, flexGrow: 1, backgroundColor: 'dark' }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Scrollable, __assign({ vertical: true }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ height: 'x108', fontFamily: 'mono', fontScale: 'p2', color: 'white', style: { wordBreak: 'break-all' } }, { children: clientKey })) })), (0, jsx_runtime_1.jsx)(fuselage_1.Button, { icon: 'copy', primary: true, onClick: function () {
                                    onCopySecurityCode();
                                    clipboard.copy();
                                } })] })), (0, jsx_runtime_1.jsx)(AgreeTermsField_1.default, { agreementField: agreementField, termsHref: termsHref, policyHref: policyHref, control: control, errors: errors })] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column' }, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.ButtonGroup, __assign({ vertical: isMobile, flexGrow: 1 }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'button', primary: true, disabled: !isValid, onClick: function () {
                                    setStep(RegisterOfflineForm_1.Steps.PASTE);
                                } }, { children: t('component.form.action.next') })), (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'button', onClick: onBackButtonClick }, { children: t('component.form.action.back') }))] })) })) })] }));
};
exports.default = CopyStep;
//# sourceMappingURL=CopyStep.js.map