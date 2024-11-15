var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var css;module.link('@rocket.chat/css-in-js',{css:function(v){css=v}},1);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},2);


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