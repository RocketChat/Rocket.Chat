var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var ParagraphBlock;module.link('./ParagraphBlock',{default:function(v){ParagraphBlock=v}},1);

const QuoteBlock = ({ children }) => (_jsx("blockquote", { children: children.map((paragraph, index) => (_jsx(ParagraphBlock, { children: paragraph.value }, index))) }));
module.exportDefault(QuoteBlock);
//# sourceMappingURL=QuoteBlock.js.map