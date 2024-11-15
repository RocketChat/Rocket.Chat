let _jsx,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v}},0);let ItalicSpan;module.link('./ItalicSpan',{default(v){ItalicSpan=v}},1);let LinkSpan;module.link('./LinkSpan',{default(v){LinkSpan=v}},2);let PlainSpan;module.link('./PlainSpan',{default(v){PlainSpan=v}},3);let StrikeSpan;module.link('./StrikeSpan',{default(v){StrikeSpan=v}},4);let CodeElement;module.link('../code/CodeElement',{default(v){CodeElement=v}},5);let EmojiElement;module.link('../emoji/EmojiElement',{default(v){EmojiElement=v}},6);let ChannelMentionElement;module.link('../mentions/ChannelMentionElement',{default(v){ChannelMentionElement=v}},7);let UserMentionElement;module.link('../mentions/UserMentionElement',{default(v){UserMentionElement=v}},8);








const BoldSpan = ({ children }) => (_jsx(_Fragment, { children: children.map((block, index) => {
        if (block.type === 'LINK' ||
            block.type === 'PLAIN_TEXT' ||
            block.type === 'STRIKE' ||
            block.type === 'ITALIC' ||
            block.type === 'INLINE_CODE') {
            return _jsx("strong", { children: renderBlockComponent(block, index) }, index);
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
        case 'STRIKE':
            return _jsx(StrikeSpan, { children: block.value }, index);
        case 'ITALIC':
            return _jsx(ItalicSpan, { children: block.value }, index);
        case 'INLINE_CODE':
            return _jsx(CodeElement, { code: block.value.value }, index);
        default:
            return null;
    }
};
module.exportDefault(BoldSpan);
//# sourceMappingURL=BoldSpan.js.map