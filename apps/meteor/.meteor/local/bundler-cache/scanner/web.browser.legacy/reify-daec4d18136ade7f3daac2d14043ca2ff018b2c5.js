var _jsx,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v}},0);var Fragment;module.link('react',{Fragment:function(v){Fragment=v}},1);var PreviewCodeElement;module.link('../code/PreviewCodeElement',{default:function(v){PreviewCodeElement=v}},2);var PreviewColorElement;module.link('../colors/PreviewColorElement',{default:function(v){PreviewColorElement=v}},3);var PreviewEmojiElement;module.link('../emoji/PreviewEmojiElement',{default:function(v){PreviewEmojiElement=v}},4);var KatexErrorBoundary;module.link('../katex/KatexErrorBoundary',{default:function(v){KatexErrorBoundary=v}},5);var PreviewKatexElement;module.link('../katex/PreviewKatexElement',{default:function(v){PreviewKatexElement=v}},6);var PreviewChannelMentionElement;module.link('../mentions/PreviewChannelMentionElement',{default:function(v){PreviewChannelMentionElement=v}},7);var PreviewUserMentionElement;module.link('../mentions/PreviewUserMentionElement',{default:function(v){PreviewUserMentionElement=v}},8);var BoldSpan;module.link('./BoldSpan',{default:function(v){BoldSpan=v}},9);var ItalicSpan;module.link('./ItalicSpan',{default:function(v){ItalicSpan=v}},10);var StrikeSpan;module.link('./StrikeSpan',{default:function(v){StrikeSpan=v}},11);











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