var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var ButtonGroup;module.link('@rocket.chat/fuselage',{ButtonGroup:function(v){ButtonGroup=v}},1);var __rest = (this && this.__rest) || function (s, e) {
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


const VideoConfMessageActions = (_a) => {
    var { children } = _a, props = __rest(_a, ["children"]);
    return (_jsx(ButtonGroup, Object.assign({}, props, { align: 'end', children: children })));
};
module.exportDefault(VideoConfMessageActions);
//# sourceMappingURL=VideoConfMessageActions.js.map