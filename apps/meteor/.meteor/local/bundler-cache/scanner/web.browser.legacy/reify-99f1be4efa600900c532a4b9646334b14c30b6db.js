var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Divider;module.link('@rocket.chat/fuselage',{Divider:function(v){Divider=v}},1);var __rest = (this && this.__rest) || function (s, e) {
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


const MessageComposerActionsDivider = (_a) => {
    var { height = 'x20' } = _a, props = __rest(_a, ["height"]);
    return (_jsx(Divider, Object.assign({ vertical: true, mi: 4, borderColor: 'light', mb: 0, backgroundColor: 'selected', height: height }, props)));
};
module.exportDefault(MessageComposerActionsDivider);
//# sourceMappingURL=MessageComposerActionsDivider.js.map