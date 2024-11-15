module.export({VideoConfPopupContainer:()=>VideoConfPopupContainer},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box,Palette;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Palette(v){Palette=v}},1);let styled;module.link('@rocket.chat/styled',{default(v){styled=v}},2);let forwardRef;module.link('react',{forwardRef(v){forwardRef=v}},3);var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};




const VideoConfPopupContainer = styled('div', (_a) => {
    var { position: _position } = _a, props = __rest(_a, ["position"]);
    return props;
}) `
	width: 100%;
	position: absolute;
	box-shadow: 0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
	background-color: ${Palette.surface['surface-light'].toString()};
	border: 1px solid ${Palette.stroke['stroke-extra-light'].toString()};
	top: ${(p) => (p.position ? `${p.position}px` : '0')};
	left: -${(p) => (p.position ? `${p.position}px` : '0')};
	border-radius: 0.25rem;
`;
const VideoConfPopup = forwardRef(function VideoConfPopup(_a, ref) {
    var { children, position } = _a, props = __rest(_a, ["children", "position"]);
    return (_jsx(VideoConfPopupContainer, Object.assign({ role: 'dialog', ref: ref, position: position }, props, { children: _jsx(Box, { p: 24, maxWidth: 'x276', color: 'default', children: children }) })));
});
module.exportDefault(VideoConfPopup);
//# sourceMappingURL=VideoConfPopup.js.map