module.export({Wrapper:()=>Wrapper});let styled;module.link('@rocket.chat/styled',{default(v){styled=v}},0);var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
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

var filterWrapperProps = function (_a) {
    var _backgroundColor = _a.backgroundColor, _color = _a.color, _backgroundImage = _a.backgroundImage, props = __rest(_a, ["backgroundColor", "color", "backgroundImage"]);
    return props;
};
var Wrapper = styled('div', filterWrapperProps)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  width: 100vw;\n  min-height: 100vh;\n  background-image: url('data:image/svg+xml,", "');\n  background-repeat: no-repeat;\n  background-position: center;\n  background-size: cover;\n  color: ", ";\n"], ["\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  width: 100vw;\n  min-height: 100vh;\n  background-image: url('data:image/svg+xml,", "');\n  background-repeat: no-repeat;\n  background-position: center;\n  background-size: cover;\n  color: ", ";\n"])), function (p) { return p.backgroundImage; }, function (p) { return p.color; });
var templateObject_1;
//# sourceMappingURL=BackgroundLayer.styles.js.map