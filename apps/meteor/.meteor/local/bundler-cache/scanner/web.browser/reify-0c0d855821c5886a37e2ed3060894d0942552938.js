let _Fragment,_jsxs;module.link("react/jsx-runtime",{Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let memo;module.link('react',{memo(v){memo=v}},1);

const toHexByte = (value) => value.toString(16).padStart(2, '0');
const PreviewColorElement = ({ r, g, b, a }) => {
    if (a === 255) {
        return (_jsxs(_Fragment, { children: ["#", toHexByte(r), toHexByte(g), toHexByte(b)] }));
    }
    return (_jsxs(_Fragment, { children: ["#", toHexByte(r), toHexByte(g), toHexByte(b), toHexByte(a)] }));
};
module.exportDefault(memo(PreviewColorElement));
//# sourceMappingURL=PreviewColorElement.js.map