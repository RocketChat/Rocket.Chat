var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var css;module.link('@rocket.chat/css-in-js',{css:function(v){css=v}},1);var Box,Button;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Button:function(v){Button=v}},2);var mergeProps,useLongPress,usePress;module.link('react-aria',{mergeProps:function(v){mergeProps=v},useLongPress:function(v){useLongPress=v},usePress:function(v){usePress=v}},3);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},4);




const dialPadButtonClass = css `
	width: 52px;
	height: 40px;
	min-width: 52px;
	padding: 4px;

	> .rcx-button--content {
		display: flex;
		flex-direction: column;
	}
`;
const VoipDialPadButton = ({ digit, subDigit, longPressDigit, onClick }) => {
    const { t } = useTranslation();
    const { longPressProps } = useLongPress({
        accessibilityDescription: `${t(`Long_press_to_do_x`, { action: longPressDigit })}`,
        onLongPress: () => longPressDigit && onClick(longPressDigit),
    });
    const { pressProps } = usePress({
        onPress: () => onClick(digit),
    });
    return (_jsxs(Button, Object.assign({ className: dialPadButtonClass }, mergeProps(pressProps, longPressProps), { "data-testid": `dial-pad-button-${digit}`, children: [_jsx(Box, { is: 'span', fontSize: 16, lineHeight: 16, children: digit }), _jsx(Box, { is: 'span', fontSize: 12, lineHeight: 12, mbs: 4, color: 'hint', "aria-hidden": true, children: subDigit })] })));
};
module.exportDefault(VoipDialPadButton);
//# sourceMappingURL=VoipDialPadButton.js.map