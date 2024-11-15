let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let AvatarContainer;module.link('@rocket.chat/fuselage',{AvatarContainer(v){AvatarContainer=v}},1);let UserAvatar;module.link('./UserAvatar',{default(v){UserAvatar=v}},2);var __rest = (this && this.__rest) || function (s, e) {
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



const MessageAvatar = (_a) => {
    var { emoji, avatarUrl, username, size = 'x36' } = _a, props = __rest(_a, ["emoji", "avatarUrl", "username", "size"]);
    if (emoji) {
        return (_jsx(AvatarContainer, Object.assign({ size: size }, props, { children: emoji })));
    }
    return _jsx(UserAvatar, Object.assign({ url: avatarUrl, username: username, size: size }, props));
};
module.exportDefault(MessageAvatar);
//# sourceMappingURL=MessageAvatar.js.map