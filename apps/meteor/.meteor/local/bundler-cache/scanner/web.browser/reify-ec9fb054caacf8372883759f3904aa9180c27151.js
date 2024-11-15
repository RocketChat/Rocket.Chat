let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useMemo,useContext,memo;module.link('react',{useMemo(v){useMemo=v},useContext(v){useContext=v},memo(v){memo=v}},1);let MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext(v){MarkupInteractionContext=v}},2);let EmojiRenderer;module.link('./EmojiRenderer',{default(v){EmojiRenderer=v}},3);let PlainSpan;module.link('../elements/PlainSpan',{default(v){PlainSpan=v}},4);var __rest = (this && this.__rest) || function (s, e) {
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