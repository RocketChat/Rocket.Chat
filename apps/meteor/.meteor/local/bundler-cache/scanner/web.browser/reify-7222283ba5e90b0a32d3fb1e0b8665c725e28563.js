let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let Box,Button;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v}},2);let mergeProps,useLongPress,usePress;module.link('react-aria',{mergeProps(v){mergeProps=v},useLongPress(v){useLongPress=v},usePress(v){usePress=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);




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