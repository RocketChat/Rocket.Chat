module.export({RoomBanner:()=>RoomBanner},true);let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let Box,Divider,Palette;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Divider(v){Divider=v},Palette(v){Palette=v}},2);let useLayout;module.link('@rocket.chat/ui-contexts',{useLayout(v){useLayout=v}},3);var __rest = (this && this.__rest) || function (s, e) {
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




const clickable = css `
	cursor: pointer;
	&:focus-visible {
		outline: ${Palette.stroke['stroke-highlight']} solid 1px;
	}
`;
const RoomBanner = (_a) => {
    var { onClick, className } = _a, props = __rest(_a, ["onClick", "className"]);
    const { isMobile } = useLayout();
    return (_jsxs(_Fragment, { children: [_jsx(Box, Object.assign({ pi: isMobile ? 'x12' : 'x24', height: 'x44', w: 'full', display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexDirection: 'row', bg: 'room', className: [onClick && clickable, ...(Array.isArray(className) ? className : [className])], onClick: onClick, tabIndex: onClick ? 0 : -1, role: onClick ? 'button' : 'banner', is: onClick ? 'button' : 'div' }, props)), _jsx(Divider, { mbs: -2, mbe: 0 })] }));
};
//# sourceMappingURL=RoomBanner.js.map