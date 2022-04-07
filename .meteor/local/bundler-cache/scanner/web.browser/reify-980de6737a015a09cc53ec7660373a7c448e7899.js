let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box,TextInput;module.link('@rocket.chat/fuselage',{Box(v){Box=v},TextInput(v){TextInput=v}},1);var __assign = (this && this.__assign) || function () {
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


var WorkspaceUrlInput = function (_a) {
    var domain = _a.domain, props = __rest(_a, ["domain"]);
    return (_jsx(TextInput, __assign({}, props, { addon: domain && (_jsx(Box, __assign({ borderInlineStart: '2px solid', mb: 'neg-x8', pb: 'x8', borderColor: 'neutral-500', color: 'info', pis: 'x12' }, { children: domain }), void 0)) }), void 0));
};
module.exportDefault(WorkspaceUrlInput);
//# sourceMappingURL=WorkspaceUrlInput.js.map