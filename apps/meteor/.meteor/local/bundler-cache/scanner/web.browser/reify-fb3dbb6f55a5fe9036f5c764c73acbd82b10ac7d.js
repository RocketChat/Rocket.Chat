let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let forwardRef;module.link('react',{forwardRef(v){forwardRef=v}},2);var __rest = (this && this.__rest) || function (s, e) {
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



const MessageFooterCallout = forwardRef(function MessageFooterCallout(_a, ref) {
    var { dashed } = _a, props = __rest(_a, ["dashed"]);
    return (_jsx(Box, Object.assign({ ref: ref }, (dashed && {
        borderStyle: 'dashed',
    }), { display: 'flex', borderWidth: 2, borderColor: 'light', borderRadius: 'x4', p: 8, mbe: 24, backgroundColor: 'surface-tint', alignItems: 'center', minHeight: 'x48', justifyContent: 'center' }, props)));
});
module.exportDefault(MessageFooterCallout);
//# sourceMappingURL=MessageFooterCallout.js.map