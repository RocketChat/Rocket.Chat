let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let ParagraphBlock;module.link('./ParagraphBlock',{default(v){ParagraphBlock=v}},1);

const QuoteBlock = ({ children }) => (_jsx("blockquote", { children: children.map((paragraph, index) => (_jsx(ParagraphBlock, { children: paragraph.value }, index))) }));
module.exportDefault(QuoteBlock);
//# sourceMappingURL=QuoteBlock.js.map