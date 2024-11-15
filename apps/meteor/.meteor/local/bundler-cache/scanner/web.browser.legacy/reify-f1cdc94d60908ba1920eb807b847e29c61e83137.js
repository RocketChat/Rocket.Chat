var _jsx,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v}},0);var CodeElement;module.link('../code/CodeElement',{default:function(v){CodeElement=v}},1);var EmojiElement;module.link('../emoji/EmojiElement',{default:function(v){EmojiElement=v}},2);var ChannelMentionElement;module.link('../mentions/ChannelMentionElement',{default:function(v){ChannelMentionElement=v}},3);var UserMentionElement;module.link('../mentions/UserMentionElement',{default:function(v){UserMentionElement=v}},4);var BoldSpan;module.link('./BoldSpan',{default:function(v){BoldSpan=v}},5);var ItalicSpan;module.link('./ItalicSpan',{default:function(v){ItalicSpan=v}},6);var LinkSpan;module.link('./LinkSpan',{default:function(v){LinkSpan=v}},7);var PlainSpan;module.link('./PlainSpan',{default:function(v){PlainSpan=v}},8);








const StrikeSpan = ({ children }) => (_jsx(_Fragment, { children: children.map((block, index) => {
        if (block.type === 'LINK' ||
            block.type === 'PLAIN_TEXT' ||
            block.type === 'ITALIC' ||
            block.type === 'BOLD' ||
            block.type === 'INLINE_CODE') {
            return _jsx("del", { children: renderBlockComponent(block, index) }, index);
        }
        return renderBlockComponent(block, index);
    }) }));
const renderBlockComponent = (block, index) => {
    switch (block.type) {
        case 'EMOJI':
            return _jsx(EmojiElement, Object.assign({}, block), index);
        case 'MENTION_USER':
            return _jsx(UserMentionElement, { mention: block.value.value }, index);
        case 'MENTION_CHANNEL':
            return _jsx(ChannelMentionElement, { mention: block.value.value }, index);
        case 'PLAIN_TEXT':
            return _jsx(PlainSpan, { text: block.value }, index);
        case 'LINK':
            return _jsx(LinkSpan, { href: block.value.src.value, label: block.value.label }, index);
        case 'ITALIC':
            return _jsx(ItalicSpan, { children: block.value }, index);
        case 'BOLD':
            return _jsx(BoldSpan, { children: block.value }, index);
        case 'INLINE_CODE':
            return _jsx(CodeElement, { code: block.value.value }, index);
        default:
            return null;
    }
};
module.exportDefault(StrikeSpan);
//# sourceMappingURL=StrikeSpan.js.map