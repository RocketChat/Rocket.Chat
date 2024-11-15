let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box,Icon;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Icon(v){Icon=v}},1);let isValidElement;module.link('react',{isValidElement(v){isValidElement=v}},2);


const HeaderTagIcon = ({ icon }) => {
    if (!icon) {
        return null;
    }
    return isValidElement(icon) ? (_jsx(Box, { marginInlineEnd: 4, display: 'inline-block', verticalAlign: 'middle', children: icon })) : (_jsx(Icon, Object.assign({ size: 'x12', mie: 4 }, icon)));
};
module.exportDefault(HeaderTagIcon);
//# sourceMappingURL=HeaderTagIcon.js.map