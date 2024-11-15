var _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v},jsxs:function(v){_jsxs=v}},0);var memo;module.link('react',{memo:function(v){memo=v}},1);var PreviewCodeBlock;module.link('./code/PreviewCodeBlock',{default:function(v){PreviewCodeBlock=v}},2);var PreviewInlineElements;module.link('./elements/PreviewInlineElements',{default:function(v){PreviewInlineElements=v}},3);var PreviewBigEmojiBlock;module.link('./emoji/PreviewBigEmojiBlock',{default:function(v){PreviewBigEmojiBlock=v}},4);var KatexErrorBoundary;module.link('./katex/KatexErrorBoundary',{default:function(v){KatexErrorBoundary=v}},5);var PreviewKatexBlock;module.link('./katex/PreviewKatexBlock',{default:function(v){PreviewKatexBlock=v}},6);






const isOnlyBigEmojiBlock = (tokens) => tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';
const PreviewMarkup = ({ tokens }) => {
    if (isOnlyBigEmojiBlock(tokens)) {
        return _jsx(PreviewBigEmojiBlock, { emoji: tokens[0].value });
    }
    const firstBlock = tokens.find((block) => block.type !== 'LINE_BREAK');
    if (!firstBlock) {
        return null;
    }
    switch (firstBlock.type) {
        case 'PARAGRAPH':
            return _jsx(PreviewInlineElements, { children: firstBlock.value });
        case 'HEADING':
            return _jsx(_Fragment, { children: firstBlock.value.map((plain) => plain.value).join('') });
        case 'UNORDERED_LIST':
        case 'ORDERED_LIST': {
            const firstItem = firstBlock.value[0];
            return (_jsxs(_Fragment, { children: [firstItem.number ? `${firstItem.number}.` : '-', " ", _jsx(PreviewInlineElements, { children: firstItem.value })] }));
        }
        case 'TASKS': {
            const firstTask = firstBlock.value[0];
            return (_jsxs(_Fragment, { children: [firstTask.status ? '\u2611' : '\u2610', " ", _jsx(PreviewInlineElements, { children: firstTask.value })] }));
        }
        case 'QUOTE': {
            const firstParagraph = firstBlock.value[0];
            return (_jsxs(_Fragment, { children: ["> ", _jsx(PreviewInlineElements, { children: firstParagraph.value })] }));
        }
        case 'CODE': {
            return _jsx(PreviewCodeBlock, { language: firstBlock.language, lines: firstBlock.value });
        }
        case 'KATEX':
            return (_jsx(KatexErrorBoundary, { code: firstBlock.value, children: _jsx(PreviewKatexBlock, { code: firstBlock.value }) }));
        default:
            return null;
    }
};
module.exportDefault(memo(PreviewMarkup));
//# sourceMappingURL=PreviewMarkup.js.map