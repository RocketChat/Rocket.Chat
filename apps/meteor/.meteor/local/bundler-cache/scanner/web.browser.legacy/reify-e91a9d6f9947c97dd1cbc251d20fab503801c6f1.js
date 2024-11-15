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
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var EmailCodeFallback = function (_a) {
    var onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'p2' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'component.emailCodeFallback' }, { children: ["Didn\u2019t receive email?", (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ onClick: onResendEmailRequest }, { children: "Resend" })), "or", (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ onClick: onChangeEmailRequest }, { children: "Change email" }))] })) })));
};
exports.default = EmailCodeFallback;
//# sourceMappingURL=EmailCodeFallback.js.map