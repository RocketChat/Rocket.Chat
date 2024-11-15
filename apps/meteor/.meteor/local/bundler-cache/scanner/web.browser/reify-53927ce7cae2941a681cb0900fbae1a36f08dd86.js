let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let VideoConfMessageRow;module.link('./VideoConfMessageRow',{default(v){VideoConfMessageRow=v}},2);var __rest = (this && this.__rest) || function (s, e) {
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



const VideoConfMessageFooter = (_a) => {
    var { children } = _a, props = __rest(_a, ["children"]);
    return (_jsx(VideoConfMessageRow, Object.assign({ backgroundColor: 'tint' }, props, { children: _jsx(Box, { mi: 'neg-x4', display: 'flex', alignItems: 'center', children: children }) })));
};
module.exportDefault(VideoConfMessageFooter);
//# sourceMappingURL=VideoConfMessageFooter.js.map