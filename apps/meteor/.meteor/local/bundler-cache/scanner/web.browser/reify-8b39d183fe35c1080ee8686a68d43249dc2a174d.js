let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Avatar,Skeleton;module.link('@rocket.chat/fuselage',{Avatar(v){Avatar=v},Skeleton(v){Skeleton=v}},1);let useEffectEvent,usePrevious;module.link('@rocket.chat/fuselage-hooks',{useEffectEvent(v){useEffectEvent=v},usePrevious(v){usePrevious=v}},2);let useState;module.link('react',{useState(v){useState=v}},3);var __rest = (this && this.__rest) || function (s, e) {
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




const BaseAvatar = (_a) => {
    var { url, onLoad, onError } = _a, props = __rest(_a, ["url", "onLoad", "onError"]);
    const [unloaded, setUnloaded] = useState(false);
    const prevUrl = usePrevious(url);
    const handleLoad = useEffectEvent((event) => {
        setUnloaded(false);
        onLoad === null || onLoad === void 0 ? void 0 : onLoad(event);
    });
    const handleError = useEffectEvent((event) => {
        setUnloaded(true);
        onError === null || onError === void 0 ? void 0 : onError(event);
    });
    if (unloaded && url === prevUrl) {
        return _jsx(Skeleton, Object.assign({ "aria-hidden": 'true', variant: 'rect' }, props));
    }
    return _jsx(Avatar, Object.assign({ "aria-hidden": 'true', onLoad: handleLoad, onError: handleError, url: url }, props));
};
module.exportDefault(BaseAvatar);
//# sourceMappingURL=BaseAvatar.js.map