var _jsx,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v}},0);var lazy;module.link('react',{lazy:function(v){lazy=v}},1);var CodeElement;module.link('../code/CodeElement',{default:function(v){CodeElement=v}},2);var ColorElement;module.link('../colors/ColorElement',{default:function(v){ColorElement=v}},3);var EmojiElement;module.link('../emoji/EmojiElement',{default:function(v){EmojiElement=v}},4);var KatexErrorBoundary;module.link('../katex/KatexErrorBoundary',{default:function(v){KatexErrorBoundary=v}},5);var ChannelMentionElement;module.link('../mentions/ChannelMentionElement',{default:function(v){ChannelMentionElement=v}},6);var UserMentionElement;module.link('../mentions/UserMentionElement',{default:function(v){UserMentionElement=v}},7);var BoldSpan;module.link('./BoldSpan',{default:function(v){BoldSpan=v}},8);var ImageElement;module.link('./ImageElement',{default:function(v){ImageElement=v}},9);var ItalicSpan;module.link('./ItalicSpan',{default:function(v){ItalicSpan=v}},10);var LinkSpan;module.link('./LinkSpan',{default:function(v){LinkSpan=v}},11);var PlainSpan;module.link('./PlainSpan',{default:function(v){PlainSpan=v}},12);var StrikeSpan;module.link('./StrikeSpan',{default:function(v){StrikeSpan=v}},13);var Timestamp;module.link('./Timestamp',{default:function(v){Timestamp=v}},14);














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