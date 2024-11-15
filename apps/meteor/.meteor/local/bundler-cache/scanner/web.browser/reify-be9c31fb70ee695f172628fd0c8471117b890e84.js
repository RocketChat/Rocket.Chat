let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},2);


const backdropStyle = css `
	position: fixed;
	top: 0;
	min-width: 276px;
	[dir='ltr'] & {
		right: 0;
	}
	[dir='rtl'] & {
		left: 0;
	}
`;
const VideoConfPopupBackdrop = ({ children }) => (_jsx(Box, { m: 40, className: backdropStyle, children: children }));
module.exportDefault(VideoConfPopupBackdrop);
//# sourceMappingURL=VideoConfPopupBackdrop.js.map