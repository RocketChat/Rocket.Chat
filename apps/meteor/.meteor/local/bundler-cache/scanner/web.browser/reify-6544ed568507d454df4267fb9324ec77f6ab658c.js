let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let IconButton,TextInput;module.link('@rocket.chat/fuselage',{IconButton(v){IconButton=v},TextInput(v){TextInput=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);



const className = css `
	padding-block: 6px;
	min-height: 28px;
	height: 28px;
`;
const VoipDialPadInput = ({ readOnly, value, onChange, onBackpaceClick }) => {
    const { t } = useTranslation();
    return (_jsx(TextInput, { p: 0, readOnly: readOnly, height: '100%', minHeight: 0, value: value, className: className, "aria-label": t('Phone_number'), addon: _jsx(IconButton, { small: true, icon: 'backspace', "aria-label": t('Remove_last_character'), "data-testid": 'dial-paid-input-backspace', size: '14px', disabled: !value, onClick: onBackpaceClick }), onChange: onChange }));
};
module.exportDefault(VoipDialPadInput);
//# sourceMappingURL=VoipDialPadInput.js.map