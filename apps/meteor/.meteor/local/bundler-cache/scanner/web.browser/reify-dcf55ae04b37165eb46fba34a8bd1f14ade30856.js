let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},2);var __rest = (this && this.__rest) || function (s, e) {
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



const EmojiPickerPreview = (_a) => {
    var { emoji, name } = _a, props = __rest(_a, ["emoji", "name"]);
    const previewEmojiClass = css `
		span {
			width: 40px;
			height: 40px;
		}
	`;
    return (_jsxs(Box, Object.assign({}, props, { display: 'flex', alignItems: 'center', children: [_jsx(Box, { className: previewEmojiClass, dangerouslySetInnerHTML: { __html: emoji } }), _jsxs(Box, { mis: 4, display: 'flex', flexDirection: 'column', maxWidth: 'x160', children: [_jsx(Box, { fontScale: 'c2', withTruncatedText: true, children: name }), _jsx(Box, { fontScale: 'c1', withTruncatedText: true, children: `:${name}:` })] })] })));
};
module.exportDefault(EmojiPickerPreview);
//# sourceMappingURL=EmojiPickerPreview.js.map