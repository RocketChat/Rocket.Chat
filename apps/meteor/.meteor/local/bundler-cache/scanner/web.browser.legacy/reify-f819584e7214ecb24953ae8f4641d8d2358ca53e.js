module.export({PasswordVerifierItem:function(){return PasswordVerifierItem}},true);var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box,Icon;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Icon:function(v){Icon=v}},1);var __rest = (this && this.__rest) || function (s, e) {
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


const variants = {
    success: {
        icon: 'success-circle',
        color: 'status-font-on-success',
    },
    error: {
        icon: 'error-circle',
        color: 'status-font-on-danger',
    },
};
const PasswordVerifierItem = (_a) => {
    var { text, isValid, vertical } = _a, props = __rest(_a, ["text", "isValid", "vertical"]);
    const { icon, color } = variants[isValid ? 'success' : 'error'];
    return (_jsxs(Box, Object.assign({ display: 'flex', flexBasis: vertical ? '100%' : '50%', alignItems: 'center', mbe: 8, fontScale: 'c1', color: color, role: 'listitem', "aria-label": text }, props, { children: [_jsx(Icon, { name: icon, color: color, size: 'x16', mie: 4 }), _jsx("span", { "aria-hidden": true, children: text })] })));
};
//# sourceMappingURL=PasswordVerifierItem.js.map