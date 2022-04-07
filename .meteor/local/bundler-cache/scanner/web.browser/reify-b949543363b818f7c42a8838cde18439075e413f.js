let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let Trans;module.link('react-i18next',{Trans(v){Trans=v}},2);let ActionLink;module.link('./ActionLink',{default(v){ActionLink=v}},3);var __assign = (this && this.__assign) || function () {
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




var EmailCodeFallback = function (_a) {
    var onResendEmailRequest = _a.onResendEmailRequest, onChangeEmailRequest = _a.onChangeEmailRequest;
    return (_jsx(Box, __assign({ fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'component.emailCodeFallback' }, { children: ["Didn\u2019t receive email?", _jsx(ActionLink, __assign({ onClick: onResendEmailRequest }, { children: "Resend" }), void 0), "or", _jsx(ActionLink, __assign({ onClick: onChangeEmailRequest }, { children: "Change email" }), void 0)] }), void 0) }), void 0));
};
module.exportDefault(EmailCodeFallback);
//# sourceMappingURL=EmailCodeFallback.js.map