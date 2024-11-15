var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Icon;module.link('@rocket.chat/fuselage',{Icon:function(v){Icon=v}},1);var __rest = (this && this.__rest) || function (s, e) {
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


const MessageComposerIcon = (_a) => {
    var { name } = _a, props = __rest(_a, ["name"]);
    return (_jsx(Icon, Object.assign({ name: name, size: 'x20', mie: 4 }, props)));
};
module.exportDefault(MessageComposerIcon);
//# sourceMappingURL=MessageComposerIcon.js.map