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
exports.Image = void 0;
var styled_1 = __importDefault(require("@rocket.chat/styled"));
var filterImageProps = function (_a) {
    var _imageUrl = _a.imageUrl, _width = _a.width, _height = _a.height, props = __rest(_a, ["imageUrl", "width", "height"]);
    return props;
};
exports.Image = styled_1.default('div', filterImageProps)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  box-shadow: 0 0 0px 1px rgba(204, 204, 204, 38%);\n  background-repeat: no-repeat;\n  background-position: 50%;\n  background-size: cover;\n  background-color: rgba(204, 204, 204, 38%);\n  background-image: url(", ");\n  width: ", "px;\n  height: ", "px;\n  overflow: hidden;\n"], ["\n  box-shadow: 0 0 0px 1px rgba(204, 204, 204, 38%);\n  background-repeat: no-repeat;\n  background-position: 50%;\n  background-size: cover;\n  background-color: rgba(204, 204, 204, 38%);\n  background-image: url(", ");\n  width: ", "px;\n  height: ", "px;\n  overflow: hidden;\n"])), function (props) { return props.imageUrl; }, function (props) { return String(props.width); }, function (props) { return String(props.height); });
var templateObject_1;
//# sourceMappingURL=ImageBlock.styles.js.map