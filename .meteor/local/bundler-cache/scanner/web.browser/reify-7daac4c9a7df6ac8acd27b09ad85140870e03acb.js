module.export({ListComponent:()=>ListComponent});let styled;module.link('@rocket.chat/styled',{default(v){styled=v}},0);var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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

var ListComponent = styled('ul', function (_a) {
    var _color = _a.color, _icon = _a.icon, _listStyleType = _a.listStyleType, props = __rest(_a, ["color", "icon", "listStyleType"]);
    return props;
})(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  padding: 0;\n  margin: 0;\n  color: ", ";\n  list-style: ", ";\n"], ["\n  padding: 0;\n  margin: 0;\n  color: ", ";\n  list-style: ", ";\n"])), function (p) { return p.color; }, function (p) {
    return p.icon
        ? "none url('data:image/svg+xml," + p.icon + "') inside"
        : (p.listStyleType || 'none') + " inside";
});
var templateObject_1;
//# sourceMappingURL=List.styles.js.map