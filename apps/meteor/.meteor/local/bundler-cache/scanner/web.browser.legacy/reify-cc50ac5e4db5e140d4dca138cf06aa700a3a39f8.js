var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Box,Icon;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Icon:function(v){Icon=v}},1);var isValidElement;module.link('react',{isValidElement:function(v){isValidElement=v}},2);


const HeaderTagIcon = ({ icon }) => {
    if (!icon) {
        return null;
    }
    return isValidElement(icon) ? (_jsx(Box, { marginInlineEnd: 4, display: 'inline-block', verticalAlign: 'middle', children: icon })) : (_jsx(Icon, Object.assign({ size: 'x12', mie: 4 }, icon)));
};
module.exportDefault(HeaderTagIcon);
//# sourceMappingURL=HeaderTagIcon.js.map