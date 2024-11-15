var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var forwardRef;module.link('react',{forwardRef:function(v){forwardRef=v}},2);var __rest = (this && this.__rest) || function (s, e) {
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



const MessageComposer = forwardRef(function MessageComposer(_a, ref) {
    var { variant } = _a, props = __rest(_a, ["variant"]);
    return (_jsx(Box, Object.assign({ "rcx-input-box__wrapper": true, mbs: 2, bg: variant === 'editing' ? 'status-background-warning-2' : undefined, ref: ref, role: 'group', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 0 }, props)));
});
module.exportDefault(MessageComposer);
//# sourceMappingURL=MessageComposer.js.map