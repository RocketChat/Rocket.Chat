let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let InlineElements;module.link('../elements/InlineElements',{default(v){InlineElements=v}},1);

const UnorderedListBlock = ({ items }) => (_jsx("ul", { children: items.map((item, index) => (_jsx("li", { children: _jsx(InlineElements, { children: item.value }) }, index))) }));
module.exportDefault(UnorderedListBlock);
//# sourceMappingURL=UnorderedListBlock.js.map