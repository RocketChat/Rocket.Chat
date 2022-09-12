module.export({sans:()=>sans,mono:()=>mono});let typography;module.link('@rocket.chat/fuselage-tokens/dist/typography.json',{default(v){typography=v}},0);
var getTokenFontFamily = function (name) {
    return typography.fontFamilies[name]
        .map(function (fontFace) { return (fontFace.includes(' ') ? "'" + fontFace + "'" : fontFace); })
        .join(', ');
};
var sans = getTokenFontFamily('sans');
var mono = getTokenFontFamily('mono');
//# sourceMappingURL=tokenFontFamilies.js.map