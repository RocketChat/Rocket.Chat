"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoTag = exports.LogoContainer = void 0;
var styled_1 = __importDefault(require("@rocket.chat/styled"));
var tagStyleProps = function (_a) {
    var _color = _a.color, _backgroundColor = _a.backgroundColor, props = __rest(_a, ["color", "backgroundColor"]);
    return props;
};
var containerProps = function (_a) {
    var _width = _a.width, props = __rest(_a, ["width"]);
    return props;
};
exports.LogoContainer = styled_1.default('div', containerProps)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  width: 100%;\n  height: 100%;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n"], ["\n  width: 100%;\n  height: 100%;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n"])));
exports.LogoTag = styled_1.default('div', tagStyleProps)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  border-radius: 90px;\n  margin: 0;\n  margin-inline-start: 0.5rem;\n  font-size: 8px;\n  font-weight: 700;\n  line-height: 100%;\n  padding: 3px 8px;\n  text-align: center;\n  color: ", ";\n  background-color: ", ";\n  border-width: 0;\n  border-style: solid;\n  border-color: currentColor;\n  outline: none;\n"], ["\n  border-radius: 90px;\n  margin: 0;\n  margin-inline-start: 0.5rem;\n  font-size: 8px;\n  font-weight: 700;\n  line-height: 100%;\n  padding: 3px 8px;\n  text-align: center;\n  color: ", ";\n  background-color: ", ";\n  border-width: 0;\n  border-style: solid;\n  border-color: currentColor;\n  outline: none;\n"])), function (p) { return p.color; }, function (p) { return p.backgroundColor; });
var templateObject_1, templateObject_2;
//# sourceMappingURL=TaggedRocketChatLogo.styles.js.map