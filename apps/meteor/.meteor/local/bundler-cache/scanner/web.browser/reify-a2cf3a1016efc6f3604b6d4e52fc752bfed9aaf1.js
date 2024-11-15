module.export({ExternalLink:()=>ExternalLink},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);var __rest = (this && this.__rest) || function (s, e) {
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


const ExternalLink = (_a) => {
    var { children, to } = _a, props = __rest(_a, ["children", "to"]);
    return (_jsx(Box, Object.assign({ is: 'a', href: to, target: '_blank', rel: 'noopener noreferrer' }, props, { children: children || to })));
};
//# sourceMappingURL=ExternalLink.js.map