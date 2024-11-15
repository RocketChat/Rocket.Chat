var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Box,Tag;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Tag:function(v){Tag=v}},1);var __rest = (this && this.__rest) || function (s, e) {
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


const HeaderTag = (_a) => {
    var { children } = _a, props = __rest(_a, ["children"]);
    return (_jsx(Box, { p: 4, withTruncatedText: true, minWidth: 'x64', children: _jsx(Tag, Object.assign({ medium: true }, props, { children: children })) }));
};
module.exportDefault(HeaderTag);
//# sourceMappingURL=HeaderTag.js.map