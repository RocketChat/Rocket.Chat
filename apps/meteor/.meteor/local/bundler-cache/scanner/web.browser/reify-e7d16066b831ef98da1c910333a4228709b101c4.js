let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box,Icon;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Icon(v){Icon=v}},1);let isValidElement;module.link('react',{isValidElement(v){isValidElement=v}},2);


const HeaderIcon = ({ icon }) => icon && (_jsx(Box, { display: 'flex', flexShrink: 0, alignItems: 'center', size: 'x18', overflow: 'hidden', justifyContent: 'center', children: isValidElement(icon) ? icon : _jsx(Icon, { color: 'default', size: 'x18', name: icon.name }) }));
module.exportDefault(HeaderIcon);
//# sourceMappingURL=HeaderIcon.js.map