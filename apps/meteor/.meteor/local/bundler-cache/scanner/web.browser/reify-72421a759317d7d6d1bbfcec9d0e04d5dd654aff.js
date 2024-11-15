let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useUserAvatarPath;module.link('@rocket.chat/ui-contexts',{useUserAvatarPath(v){useUserAvatarPath=v}},1);let memo;module.link('react',{memo(v){memo=v}},2);let BaseAvatar;module.link('./BaseAvatar',{default(v){BaseAvatar=v}},3);var __rest = (this && this.__rest) || function (s, e) {
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




const UserAvatar = (_a) => {
    var { username, etag } = _a, rest = __rest(_a, ["username", "etag"]);
    const getUserAvatarPath = useUserAvatarPath();
    const { url = getUserAvatarPath(username, etag) } = rest, props = __rest(rest, ["url"]);
    return _jsx(BaseAvatar, Object.assign({ url: url, "data-username": username, title: username }, props));
};
module.exportDefault(memo(UserAvatar));
//# sourceMappingURL=UserAvatar.js.map