var _jsx,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v}},0);var lazy,memo;module.link('react',{lazy:function(v){lazy=v},memo:function(v){memo=v}},1);var HeadingBlock;module.link('./blocks/HeadingBlock',{default:function(v){HeadingBlock=v}},2);var OrderedListBlock;module.link('./blocks/OrderedListBlock',{default:function(v){OrderedListBlock=v}},3);var ParagraphBlock;module.link('./blocks/ParagraphBlock',{default:function(v){ParagraphBlock=v}},4);var QuoteBlock;module.link('./blocks/QuoteBlock',{default:function(v){QuoteBlock=v}},5);var TaskList;module.link('./blocks/TaskListBlock',{default:function(v){TaskList=v}},6);var UnorderedListBlock;module.link('./blocks/UnorderedListBlock',{default:function(v){UnorderedListBlock=v}},7);var BigEmojiBlock;module.link('./emoji/BigEmojiBlock',{default:function(v){BigEmojiBlock=v}},8);var KatexErrorBoundary;module.link('./katex/KatexErrorBoundary',{default:function(v){KatexErrorBoundary=v}},9);









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