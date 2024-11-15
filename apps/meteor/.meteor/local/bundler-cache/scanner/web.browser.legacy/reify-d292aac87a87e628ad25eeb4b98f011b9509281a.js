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
var fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
var layout_1 = require("@rocket.chat/layout");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var RegisterOfflineForm_1 = require("../RegisterOfflineForm");
var PasteStep = function (_a) {
    var setStep = _a.setStep;
    var t = (0, react_i18next_1.useTranslation)().t;
    var breakpoints = (0, fuselage_hooks_1.useBreakpoints)();
    var isMobile = !breakpoints.includes('md');
    var _b = (0, react_hook_form_1.useFormContext)(), register = _b.register, _c = _b.formState, isSubmitting = _c.isSubmitting, isValidating = _c.isValidating, isSubmitSuccessful = _c.isSubmitSuccessful;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(layout_1.Form.Container, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ mbe: '24px', fontScale: 'p2' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, { children: ["1. In ", (0, jsx_runtime_1.jsx)("strong", { children: "cloud.rocket.chat" }), " get the generated text and paste below to complete your registration process"] }, 'form.registerOfflineForm.pasteStep.description') })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: 16, flexGrow: 1, backgroundColor: 'dark' }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Scrollable, __assign({ vertical: true }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({}, register('token', { required: true }), { is: 'textarea', backgroundColor: 'dark', height: 'x108', fontFamily: 'mono', fontScale: 'p2', color: 'white', style: { wordBreak: 'break-all', resize: 'none' }, placeholder: t('component.form.action.pasteHere'), autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: 'false' })) })) }))] }), (0, jsx_runtime_1.jsx)(layout_1.Form.Footer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column' }, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.ButtonGroup, __assign({ vertical: isMobile, flexGrow: 1 }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'submit', primary: true, disabled: isSubmitting || isValidating || isSubmitSuccessful }, { children: t('component.form.action.completeRegistration') })), (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ type: 'button', onClick: function () { return setStep(RegisterOfflineForm_1.Steps.COPY); } }, { children: t('component.form.action.back') }))] })) })) })] }));
};
exports.default = PasteStep;
//# sourceMappingURL=PasteStep.js.map