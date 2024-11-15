let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Button;module.link('@rocket.chat/fuselage',{Button(v){Button=v}},1);var __rest = (this && this.__rest) || function (s, e) {
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


const VideoConfMessageButton = (_a) => {
    var { primary } = _a, props = __rest(_a, ["primary"]);
    return (_jsx(Button, Object.assign({}, props, { mi: 4, small: true, primary: primary })));
};
module.exportDefault(VideoConfMessageButton);
//# sourceMappingURL=VideoConfMessageButton.js.map