"use strict";
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
const styled_1 = __importDefault(require("@rocket.chat/styled"));
const filterImageProps = (_a) => {
    var { imageUrl: _imageUrl, width: _width, height: _height } = _a, props = __rest(_a, ["imageUrl", "width", "height"]);
    return props;
};
exports.Image = (0, styled_1.default)('div', filterImageProps) `
  box-shadow: 0 0 0px 1px rgba(204, 204, 204, 38%);
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: cover;
  background-color: rgba(204, 204, 204, 38%);
  background-image: url(${(props) => props.imageUrl});
  width: ${(props) => String(props.width)}px;
  height: ${(props) => String(props.height)}px;
  overflow: hidden;
`;
//# sourceMappingURL=ImageBlock.styles.js.map