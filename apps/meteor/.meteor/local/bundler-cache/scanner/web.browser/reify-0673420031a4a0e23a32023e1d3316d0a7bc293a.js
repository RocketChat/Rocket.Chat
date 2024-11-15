let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let memo;module.link('react',{memo(v){memo=v}},1);

const ColorElement = ({ r, g, b, a }) => (_jsxs("span", { children: [_jsx("span", { style: {
                backgroundColor: `rgba(${r}, ${g}, ${b}, ${(a / 255) * 100}%)`,
                display: 'inline-block',
                width: '1em',
                height: '1em',
                verticalAlign: 'middle',
                marginInlineEnd: '0.5em',
            } }), "rgba(", r, ", ", g, ", ", b, ", ", (a / 255) * 100, "%)"] }));
module.exportDefault(memo(ColorElement));
//# sourceMappingURL=ColorElement.js.map