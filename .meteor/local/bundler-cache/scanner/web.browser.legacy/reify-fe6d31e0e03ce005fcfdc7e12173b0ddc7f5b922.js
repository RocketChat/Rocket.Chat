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
var react_i18next_1 = require("react-i18next");
var ActionLink_1 = __importDefault(require("./ActionLink"));
var EmailCodeFallback = function (_a) {
    var onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    return (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'c1' }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'component.emailCodeFallback' }, { children: ["Didn\u2019t receive email?", jsx_runtime_1.jsx(ActionLink_1.default, __assign({ onClick: onResendEmailRequest }, { children: "Resend" }), void 0), "or", jsx_runtime_1.jsx(ActionLink_1.default, __assign({ onClick: onChangeEmailRequest }, { children: "Change email" }), void 0)] }), void 0) }), void 0));
};
exports.default = EmailCodeFallback;
//# sourceMappingURL=EmailCodeFallback.js.map