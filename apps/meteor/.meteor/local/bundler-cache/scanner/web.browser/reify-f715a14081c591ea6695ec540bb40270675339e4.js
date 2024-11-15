module.export({Element:()=>Element},true);let styled;module.link('@rocket.chat/styled',{default(v){styled=v}},0);var __rest = (this && this.__rest) || function (s, e) {
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

const filterElementProps = (_a) => {
    var { imageUrl: _imageUrl, size: _size } = _a, props = __rest(_a, ["imageUrl", "size"]);
    return props;
};
const Element = styled('div', filterElementProps) `
  box-shadow: 0 0 0px 1px rgba(204, 204, 204, 38%);
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: cover;
  background-color: rgba(204, 204, 204, 38%);
  background-image: url(${(props) => props.imageUrl});
  width: ${(props) => String(props.size)}px;
  height: ${(props) => String(props.size)}px;
  border-radius: 4px;
  overflow: hidden;
  margin-inline-start: 4px;
`;
//# sourceMappingURL=ImageElement.styles.js.map