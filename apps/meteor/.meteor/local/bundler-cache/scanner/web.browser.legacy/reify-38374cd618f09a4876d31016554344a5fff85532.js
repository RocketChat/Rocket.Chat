var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Icon,IconButton;module.link('@rocket.chat/fuselage',{Icon:function(v){Icon=v},IconButton:function(v){IconButton=v}},1);

const HeaderState = (props) => props.onClick ? _jsx(IconButton, Object.assign({ mini: true }, props)) : _jsx(Icon, Object.assign({ size: 'x16', name: props.icon }, props));
module.exportDefault(HeaderState);
//# sourceMappingURL=HeaderState.js.map