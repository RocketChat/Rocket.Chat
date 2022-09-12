let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Icon;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Icon(v){Icon=v}},1);var __assign = (this && this.__assign) || function () {
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


var ListItem = function (_a) {
    var children = _a.children, icon = _a.icon, _b = _a.iconColor, iconColor = _b === void 0 ? 'success' : _b, _c = _a.fontScale, fontScale = _c === void 0 ? 'c1' : _c;
    return (_jsxs(Box, __assign({ display: 'flex', is: 'li', fontScale: fontScale, color: 'inherit' }, { children: [icon && _jsx(Icon, { name: icon, color: iconColor, size: 'x16', mie: 'x4' }, void 0), children] }), void 0));
};
module.exportDefault(ListItem);
//# sourceMappingURL=ListItem.js.map