let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let memo;module.link('react',{memo(v){memo=v}},1);let PreviewCodeBlock;module.link('./code/PreviewCodeBlock',{default(v){PreviewCodeBlock=v}},2);let PreviewInlineElements;module.link('./elements/PreviewInlineElements',{default(v){PreviewInlineElements=v}},3);let PreviewBigEmojiBlock;module.link('./emoji/PreviewBigEmojiBlock',{default(v){PreviewBigEmojiBlock=v}},4);let KatexErrorBoundary;module.link('./katex/KatexErrorBoundary',{default(v){KatexErrorBoundary=v}},5);let PreviewKatexBlock;module.link('./katex/PreviewKatexBlock',{default(v){PreviewKatexBlock=v}},6);






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