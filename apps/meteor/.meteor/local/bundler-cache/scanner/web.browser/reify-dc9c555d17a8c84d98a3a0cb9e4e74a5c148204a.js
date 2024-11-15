let _jsx,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v}},0);let Fragment;module.link('react',{Fragment(v){Fragment=v}},1);let BoldSpan;module.link('./BoldSpan',{default(v){BoldSpan=v}},2);let ItalicSpan;module.link('./ItalicSpan',{default(v){ItalicSpan=v}},3);let StrikeSpan;module.link('./StrikeSpan',{default(v){StrikeSpan=v}},4);let PreviewCodeElement;module.link('../code/PreviewCodeElement',{default(v){PreviewCodeElement=v}},5);let PreviewColorElement;module.link('../colors/PreviewColorElement',{default(v){PreviewColorElement=v}},6);let PreviewEmojiElement;module.link('../emoji/PreviewEmojiElement',{default(v){PreviewEmojiElement=v}},7);let KatexErrorBoundary;module.link('../katex/KatexErrorBoundary',{default(v){KatexErrorBoundary=v}},8);let PreviewKatexElement;module.link('../katex/PreviewKatexElement',{default(v){PreviewKatexElement=v}},9);let PreviewChannelMentionElement;module.link('../mentions/PreviewChannelMentionElement',{default(v){PreviewChannelMentionElement=v}},10);let PreviewUserMentionElement;module.link('../mentions/PreviewUserMentionElement',{default(v){PreviewUserMentionElement=v}},11);











const PreviewInlineElements = ({ children }) => (_jsx(_Fragment, { children: children.map((child, index) => {
        switch (child.type) {
            case 'BOLD':
                return _jsx(BoldSpan, { children: child.value }, index);
            case 'STRIKE':
                return _jsx(StrikeSpan, { children: child.value }, index);
            case 'ITALIC':
                return _jsx(ItalicSpan, { children: child.value }, index);
            case 'LINK':
                return (_jsx(PreviewInlineElements, { children: Array.isArray(child.value.label) ? child.value.label : [child.value.label] }, index));
            case 'PLAIN_TEXT':
                return _jsx(Fragment, { children: child.value }, index);
            case 'IMAGE':
                return _jsx(PreviewInlineElements, { children: [child.value.label] }, index);
            case 'MENTION_USER':
                return _jsx(PreviewUserMentionElement, { mention: child.value.value }, index);
            case 'MENTION_CHANNEL':
                return _jsx(PreviewChannelMentionElement, { mention: child.value.value }, index);
            case 'INLINE_CODE':
                return _jsx(PreviewCodeElement, { code: child.value.value }, index);
            case 'EMOJI':
                return _jsx(PreviewEmojiElement, Object.assign({}, child), index);
            case 'COLOR':
                return _jsx(PreviewColorElement, Object.assign({}, child.value), index);
            case 'INLINE_KATEX':
                return (_jsx(KatexErrorBoundary, { code: child.value, children: _jsx(PreviewKatexElement, { code: child.value }) }, index));
            default:
                return null;
        }
    }) }));
module.exportDefault(PreviewInlineElements);
//# sourceMappingURL=PreviewInlineElements.js.map