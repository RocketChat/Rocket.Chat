let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},2);var __assign = (this && this.__assign) || function () {
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



var Form = function (_a) {
    var onSubmit = _a.onSubmit, children = _a.children;
    return (_jsx(Box, __assign({ is: 'form', backgroundColor: colors.white, color: colors.n800, padding: 40, width: 'full', maxWidth: 576, borderRadius: 4, textAlign: 'left', onSubmit: onSubmit }, { children: children }), void 0));
};
module.exportDefault(Form);
//# sourceMappingURL=Form.js.map