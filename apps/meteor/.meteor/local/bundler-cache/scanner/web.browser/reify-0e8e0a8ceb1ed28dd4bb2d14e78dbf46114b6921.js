let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Tile;module.link('@rocket.chat/fuselage',{Tile(v){Tile=v}},1);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},2);let forwardRef;module.link('react',{forwardRef(v){forwardRef=v}},3);var __assign = (this && this.__assign) || function () {
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




var Form = forwardRef(function (_a, ref) {
    var props = __rest(_a, []);
    return (_jsx(Tile, __assign({ ref: ref, is: 'form', backgroundColor: colors.white, color: colors.n800, padding: 40, width: 'full', maxWidth: 576, textAlign: 'left' }, props)));
});
module.exportDefault(Form);
//# sourceMappingURL=Form.js.map