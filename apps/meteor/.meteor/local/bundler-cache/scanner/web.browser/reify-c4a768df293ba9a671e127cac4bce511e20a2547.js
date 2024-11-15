let _jsx,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v}},0);let lazy,memo;module.link('react',{lazy(v){lazy=v},memo(v){memo=v}},1);let HeadingBlock;module.link('./blocks/HeadingBlock',{default(v){HeadingBlock=v}},2);let OrderedListBlock;module.link('./blocks/OrderedListBlock',{default(v){OrderedListBlock=v}},3);let ParagraphBlock;module.link('./blocks/ParagraphBlock',{default(v){ParagraphBlock=v}},4);let QuoteBlock;module.link('./blocks/QuoteBlock',{default(v){QuoteBlock=v}},5);let TaskList;module.link('./blocks/TaskListBlock',{default(v){TaskList=v}},6);let UnorderedListBlock;module.link('./blocks/UnorderedListBlock',{default(v){UnorderedListBlock=v}},7);let BigEmojiBlock;module.link('./emoji/BigEmojiBlock',{default(v){BigEmojiBlock=v}},8);let KatexErrorBoundary;module.link('./katex/KatexErrorBoundary',{default(v){KatexErrorBoundary=v}},9);









const CodeBlock = lazy(() => module.dynamicImport('./code/CodeBlock'));
const KatexBlock = lazy(() => module.dynamicImport('./katex/KatexBlock'));
const Markup = ({ tokens }) => (_jsx(_Fragment, { children: tokens.map((block, index) => {
        switch (block.type) {
            case 'BIG_EMOJI':
                return _jsx(BigEmojiBlock, { emoji: block.value }, index);
            case 'PARAGRAPH':
                return _jsx(ParagraphBlock, { children: block.value }, index);
            case 'HEADING':
                return _jsx(HeadingBlock, { level: block.level, children: block.value }, index);
            case 'UNORDERED_LIST':
                return _jsx(UnorderedListBlock, { items: block.value }, index);
            case 'ORDERED_LIST':
                return _jsx(OrderedListBlock, { items: block.value }, index);
            case 'TASKS':
                return _jsx(TaskList, { tasks: block.value }, index);
            case 'QUOTE':
                return _jsx(QuoteBlock, { children: block.value }, index);
            case 'CODE':
                return _jsx(CodeBlock, { language: block.language, lines: block.value }, index);
            case 'KATEX':
                return (_jsx(KatexErrorBoundary, { code: block.value, children: _jsx(KatexBlock, { code: block.value }) }, index));
            case 'LINE_BREAK':
                return _jsx("br", {}, index);
            default:
                return null;
        }
    }) }));
module.exportDefault(memo(Markup));
//# sourceMappingURL=Markup.js.map