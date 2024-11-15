let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Icon,IconButton;module.link('@rocket.chat/fuselage',{Icon(v){Icon=v},IconButton(v){IconButton=v}},1);

const VoipActionButton = ({ disabled, label, pressed, icon, danger, success, className, onClick }) => (_jsx(IconButton, { medium: true, danger: danger, success: success, secondary: success || danger, className: className, icon: _jsx(Icon, { name: icon }), title: label, pressed: pressed, "aria-label": label, disabled: disabled, onClick: () => onClick === null || onClick === void 0 ? void 0 : onClick() }));
module.exportDefault(VoipActionButton);
//# sourceMappingURL=VoipActionButton.js.map