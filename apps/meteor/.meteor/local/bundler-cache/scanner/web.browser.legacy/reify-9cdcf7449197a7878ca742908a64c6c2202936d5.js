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
exports.Steps = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var layout_1 = require("@rocket.chat/layout");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var react_i18next_1 = require("react-i18next");
var CopyStep_1 = __importDefault(require("./steps/CopyStep"));
var PasteStep_1 = __importDefault(require("./steps/PasteStep"));
exports.Steps = {
    COPY: 'copy',
    PASTE: 'paste',
};
var RegisterOfflineForm = function (_a) {
    var termsHref = _a.termsHref, policyHref = _a.policyHref, clientKey = _a.clientKey, onSubmit = _a.onSubmit, onCopySecurityCode = _a.onCopySecurityCode, onBackButtonClick = _a.onBackButtonClick;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _b = (0, react_1.useState)(exports.Steps.COPY), step = _b[0], setStep = _b[1];
    var form = (0, react_hook_form_1.useForm)({
        mode: 'onChange',
        defaultValues: {
            token: '',
            agreement: false,
        },
    });
    var handleSubmit = form.handleSubmit;
    return ((0, jsx_runtime_1.jsx)(react_hook_form_1.FormProvider, __assign({}, form, { children: (0, jsx_runtime_1.jsxs)(layout_1.Form, __assign({ onSubmit: handleSubmit(onSubmit) }, { children: [(0, jsx_runtime_1.jsx)(layout_1.Form.Header, { children: (0, jsx_runtime_1.jsx)(layout_1.Form.Title, { children: t('form.registerOfflineForm.title') }) }), step === exports.Steps.COPY ? ((0, jsx_runtime_1.jsx)(CopyStep_1.default, { termsHref: termsHref, policyHref: policyHref, clientKey: clientKey, setStep: setStep, onCopySecurityCode: onCopySecurityCode, onBackButtonClick: onBackButtonClick })) : ((0, jsx_runtime_1.jsx)(PasteStep_1.default, { setStep: setStep }))] })) })));
};
exports.default = RegisterOfflineForm;
//# sourceMappingURL=RegisterOfflineForm.js.map