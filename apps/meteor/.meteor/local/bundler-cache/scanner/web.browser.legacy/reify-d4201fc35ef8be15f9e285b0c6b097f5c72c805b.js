var _jsx,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v}},0);var MessageEmoji,ThreadMessageEmoji;module.link('@rocket.chat/fuselage',{MessageEmoji:function(v){MessageEmoji=v},ThreadMessageEmoji:function(v){ThreadMessageEmoji=v}},1);var DOMPurify;module.link('dompurify',{default:function(v){DOMPurify=v}},2);var useMemo,useContext,memo;module.link('react',{useMemo:function(v){useMemo=v},useContext:function(v){useContext=v},memo:function(v){memo=v}},3);var MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext:function(v){MarkupInteractionContext=v}},4);var __rest = (this && this.__rest) || function (s, e) {
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





const EmojiRenderer = (_a) => {
    var _b;
    var { big = false, preview = false } = _a, emoji = __rest(_a, ["big", "preview"]);
    const { detectEmoji } = useContext(MarkupInteractionContext);
    const fallback = useMemo(() => { var _a; return ('unicode' in emoji ? emoji.unicode : `:${(_a = emoji.shortCode) !== null && _a !== void 0 ? _a : emoji.value.value}:`); }, [emoji]);
    const sanitizedFallback = DOMPurify.sanitize(fallback);
    const descriptors = useMemo(() => {
        const detected = detectEmoji === null || detectEmoji === void 0 ? void 0 : detectEmoji(sanitizedFallback);
        return (detected === null || detected === void 0 ? void 0 : detected.length) !== 0 ? detected : undefined;
    }, [detectEmoji, sanitizedFallback]);
    return (_jsx(_Fragment, { children: (_b = descriptors === null || descriptors === void 0 ? void 0 : descriptors.map(({ name, className, image, content }, i) => (_jsx("span", { title: name, children: preview ? (_jsx(ThreadMessageEmoji, { className: className, name: name, image: image, children: content })) : (_jsx(MessageEmoji, { big: big, className: className, name: name, image: image, children: content })) }, i)))) !== null && _b !== void 0 ? _b : (_jsx("span", { role: 'img', "aria-label": sanitizedFallback.charAt(0) === ':' ? sanitizedFallback : undefined, children: sanitizedFallback })) }));
};
module.exportDefault(memo(EmojiRenderer));
//# sourceMappingURL=EmojiRenderer.js.map