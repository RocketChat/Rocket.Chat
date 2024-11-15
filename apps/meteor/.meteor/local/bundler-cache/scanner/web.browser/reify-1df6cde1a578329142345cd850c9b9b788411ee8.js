let _jsx,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v}},0);let lazy;module.link('react',{lazy(v){lazy=v}},1);let CodeElement;module.link('../code/CodeElement',{default(v){CodeElement=v}},2);let ColorElement;module.link('../colors/ColorElement',{default(v){ColorElement=v}},3);let EmojiElement;module.link('../emoji/EmojiElement',{default(v){EmojiElement=v}},4);let KatexErrorBoundary;module.link('../katex/KatexErrorBoundary',{default(v){KatexErrorBoundary=v}},5);let ChannelMentionElement;module.link('../mentions/ChannelMentionElement',{default(v){ChannelMentionElement=v}},6);let UserMentionElement;module.link('../mentions/UserMentionElement',{default(v){UserMentionElement=v}},7);let BoldSpan;module.link('./BoldSpan',{default(v){BoldSpan=v}},8);let ImageElement;module.link('./ImageElement',{default(v){ImageElement=v}},9);let ItalicSpan;module.link('./ItalicSpan',{default(v){ItalicSpan=v}},10);let LinkSpan;module.link('./LinkSpan',{default(v){LinkSpan=v}},11);let PlainSpan;module.link('./PlainSpan',{default(v){PlainSpan=v}},12);let StrikeSpan;module.link('./StrikeSpan',{default(v){StrikeSpan=v}},13);let Timestamp;module.link('./Timestamp',{default(v){Timestamp=v}},14);














const KatexElement = lazy(() => module.dynamicImport('../katex/KatexElement'));
const InlineElements = ({ children }) => (_jsx(_Fragment, { children: children.map((child, index) => {
        switch (child.type) {
            case 'BOLD':
                return _jsx(BoldSpan, { children: child.value }, index);
            case 'STRIKE':
                return _jsx(StrikeSpan, { children: child.value }, index);
            case 'ITALIC':
                return _jsx(ItalicSpan, { children: child.value }, index);
            case 'LINK':
                return (_jsx(LinkSpan, { href: child.value.src.value, label: Array.isArray(child.value.label) ? child.value.label : [child.value.label] }, index));
            case 'PLAIN_TEXT':
                return _jsx(PlainSpan, { text: child.value }, index);
            case 'IMAGE':
                return _jsx(ImageElement, { src: child.value.src.value, alt: child.value.label }, index);
            case 'MENTION_USER':
                return _jsx(UserMentionElement, { mention: child.value.value }, index);
            case 'MENTION_CHANNEL':
                return _jsx(ChannelMentionElement, { mention: child.value.value }, index);
            case 'INLINE_CODE':
                return _jsx(CodeElement, { code: child.value.value }, index);
            case 'EMOJI':
                return _jsx(EmojiElement, Object.assign({}, child), index);
            case 'COLOR':
                return _jsx(ColorElement, Object.assign({}, child.value), index);
            case 'INLINE_KATEX':
                return (_jsx(KatexErrorBoundary, { code: child.value, children: _jsx(KatexElement, { code: child.value }) }, index));
            case 'TIMESTAMP': {
                return _jsx(Timestamp, { children: child }, index);
            }
            default: {
                if ('fallback' in child) {
                    return _jsx(InlineElements, { children: [child.fallback] }, index);
                }
                return null;
            }
        }
    }) }));
module.exportDefault(InlineElements);
//# sourceMappingURL=InlineElements.js.map