let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Icon,IconButton;module.link('@rocket.chat/fuselage',{Icon(v){Icon=v},IconButton(v){IconButton=v}},1);

const HeaderState = (props) => (props.onClick ? _jsx(IconButton, Object.assign({ mini: true }, props)) : _jsx(Icon, Object.assign({ size: 'x16', name: props.icon }, props)));
module.exportDefault(HeaderState);
//# sourceMappingURL=HeaderState.js.map