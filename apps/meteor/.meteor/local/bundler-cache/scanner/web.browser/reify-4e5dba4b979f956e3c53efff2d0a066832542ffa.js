let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},2);let FocusScope;module.link('react-aria',{FocusScope(v){FocusScope=v}},3);let DialPadButton;module.link('./components/VoipDialPadButton',{default(v){DialPadButton=v}},4);let DialPadInput;module.link('./components/VoipDialPadInput',{default(v){DialPadInput=v}},5);





const DIGITS = [
    ['1', ''],
    ['2', 'ABC'],
    ['3', 'DEF'],
    ['4', 'GHI'],
    ['5', 'JKL'],
    ['6', 'MNO'],
    ['7', 'PQRS'],
    ['8', 'TUV'],
    ['9', 'WXYZ'],
    ['*', ''],
    ['0', '+', '+'],
    ['#', ''],
];
const dialPadClassName = css `
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px 8px 12px;

	> button {
		margin: 4px;
	}
`;
const VoipDialPad = ({ editable = false, value, longPress = true, onChange }) => (_jsx(FocusScope, { autoFocus: true, children: _jsxs(Box, { bg: 'surface-light', children: [_jsx(Box, { display: 'flex', pi: 12, pbs: 4, pbe: 8, bg: 'surface-neutral', children: _jsx(DialPadInput, { value: value, readOnly: !editable, onChange: (e) => onChange(e.currentTarget.value), onBackpaceClick: () => onChange(value.slice(0, -1)) }) }), _jsx(Box, { className: dialPadClassName, maxWidth: 196, mi: 'auto', children: DIGITS.map(([primaryDigit, subDigit, longPressDigit]) => (_jsx(DialPadButton, { digit: primaryDigit, subDigit: subDigit, longPressDigit: longPress ? longPressDigit : undefined, onClick: (digit) => onChange(`${value}${digit}`, digit) }, primaryDigit))) })] }) }));
module.exportDefault(VoipDialPad);
//# sourceMappingURL=VoipDialPad.js.map