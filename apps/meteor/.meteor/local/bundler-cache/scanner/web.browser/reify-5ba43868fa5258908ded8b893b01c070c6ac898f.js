let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let Box,Palette;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Palette(v){Palette=v}},2);var __rest = (this && this.__rest) || function (s, e) {
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



const HeaderTitleButton = (_a) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    const customClass = css `
		border-width: 1px;
		border-style: solid;
		border-color: transparent;

		&:hover {
			cursor: pointer;
			background-color: ${Palette.surface['surface-hover']};
		}
		&:focus.focus-visible {
			outline: 0;
			box-shadow: 0 0 0 2px ${Palette.stroke['stroke-extra-light-highlight']};
			border-color: ${Palette.stroke['stroke-highlight']};
		}
	`;
    return _jsx(Box, Object.assign({ display: 'flex', alignItems: 'center', borderRadius: 4, withTruncatedText: true, className: [customClass, className] }, props));
};
module.exportDefault(HeaderTitleButton);
//# sourceMappingURL=HeaderTitleButton.js.map