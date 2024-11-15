var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var css;module.link('@rocket.chat/css-in-js',{css:function(v){css=v}},1);var Box,Palette;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Palette:function(v){Palette=v}},2);var forwardRef;module.link('react',{forwardRef:function(v){forwardRef=v}},3);



const messageComposerInputStyle = css `
	resize: none;

	&::placeholder {
		color: ${Palette.text['font-annotation']};
	}
`;
const MessageComposerInput = forwardRef(function MessageComposerInput(props, ref) {
    return (_jsx(Box, { is: 'label', width: 'full', fontSize: 0, children: _jsx(Box, Object.assign({ className: [messageComposerInputStyle, 'rc-message-box__textarea js-input-message'], color: 'default', width: 'full', minHeight: '20px', maxHeight: '155px', rows: 1, fontScale: 'p2', ref: ref, pi: 12, mb: 16, borderWidth: 0, is: 'textarea' }, props)) }));
});
module.exportDefault(MessageComposerInput);
//# sourceMappingURL=MessageComposerInput.js.map