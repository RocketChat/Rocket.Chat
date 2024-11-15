var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useMemo,useContext,memo;module.link('react',{useMemo:function(v){useMemo=v},useContext:function(v){useContext=v},memo:function(v){memo=v}},1);var MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext:function(v){MarkupInteractionContext=v}},2);var PlainSpan;module.link('../elements/PlainSpan',{default:function(v){PlainSpan=v}},3);var EmojiRenderer;module.link('./EmojiRenderer',{default:function(v){EmojiRenderer=v}},4);var __rest = (this && this.__rest) || function (s, e) {
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





const Emoji = (_a) => {
    var { big = false, preview = false } = _a, emoji = __rest(_a, ["big", "preview"]);
    const { convertAsciiToEmoji, useEmoji } = useContext(MarkupInteractionContext);
    const asciiEmoji = useMemo(() => ('shortCode' in emoji && emoji.value.value !== emoji.shortCode ? emoji.value.value : undefined), [emoji]);
    if (!useEmoji && 'shortCode' in emoji) {
        return _jsx(PlainSpan, { text: emoji.shortCode === emoji.value.value ? `:${emoji.shortCode}:` : emoji.value.value });
    }
    if (!convertAsciiToEmoji && asciiEmoji) {
        return _jsx(PlainSpan, { text: asciiEmoji });
    }
    return _jsx(EmojiRenderer, Object.assign({ big: big, preview: preview }, emoji));
};
module.exportDefault(memo(Emoji));
//# sourceMappingURL=Emoji.js.map