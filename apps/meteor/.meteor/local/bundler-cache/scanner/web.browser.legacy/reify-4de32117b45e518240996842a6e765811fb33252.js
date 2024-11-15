var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Box,Icon;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Icon:function(v){Icon=v}},1);var isValidElement;module.link('react',{isValidElement:function(v){isValidElement=v}},2);


const HeaderIcon = ({ icon }) => icon && (_jsx(Box, { display: 'flex', flexShrink: 0, alignItems: 'center', overflow: 'hidden', justifyContent: 'center', children: isValidElement(icon) ? icon : _jsx(Icon, { color: 'default', size: 'x20', name: icon.name }) }));
module.exportDefault(HeaderIcon);
//# sourceMappingURL=HeaderIcon.js.map