let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let PlainSpan;module.link('../elements/PlainSpan',{default(v){PlainSpan=v}},1);

const HeadingBlock = ({ children = [], level = 1 }) => {
    const HeadingTag = `h${level}`;
    return (_jsx(HeadingTag, { children: children.map((block, index) => (_jsx(PlainSpan, { text: block.value }, index))) }));
};
module.exportDefault(HeadingBlock);
//# sourceMappingURL=HeadingBlock.js.map