let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Margins;module.link('@rocket.chat/fuselage',{Margins(v){Margins=v}},1);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},2);let ListComponent;module.link('./List.styles',{ListComponent(v){ListComponent=v}},3);let ListItem;module.link('./ListItem',{default(v){ListItem=v}},4);var __assign = (this && this.__assign) || function () {
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





var List = function (_a) {
    var children = _a.children, listStyleType = _a.listStyleType, icon = _a.icon, _b = _a.spacing, spacing = _b === void 0 ? 'x6' : _b, _c = _a.color, color = _c === void 0 ? colors.n900 : _c;
    return (_jsx(ListComponent, __assign({ icon: icon, listStyleType: listStyleType, color: color }, { children: _jsx(Margins, __assign({ block: spacing }, { children: children }), void 0) }), void 0));
};
List.Item = ListItem;
module.exportDefault(List);
//# sourceMappingURL=List.js.map