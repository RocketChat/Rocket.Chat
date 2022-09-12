let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},1);let RocketChatLogo;module.link('../RocketChatLogo',{default(v){RocketChatLogo=v}},2);let LogoContainer,LogoTag;module.link('./TaggedRocketChatLogo.styles',{LogoContainer(v){LogoContainer=v},LogoTag(v){LogoTag=v}},3);var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
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




var TaggedRocketChatLogo = function (_a) {
    var tagTitle = _a.tagTitle, _b = _a.tagBackground, tagBackground = _b === void 0 ? colors.d400 : _b, _c = _a.color, color = _c === void 0 ? colors.white : _c, props = __rest(_a, ["tagTitle", "tagBackground", "color"]);
    return (_jsxs(LogoContainer, __assign({}, props, { children: [_jsx(RocketChatLogo, {}, void 0), tagTitle && (_jsx(LogoTag, __assign({ backgroundColor: tagBackground, color: color }, { children: tagTitle }), void 0))] }), void 0));
};
module.exportDefault(TaggedRocketChatLogo);
//# sourceMappingURL=TaggedRocketChatLogo.js.map