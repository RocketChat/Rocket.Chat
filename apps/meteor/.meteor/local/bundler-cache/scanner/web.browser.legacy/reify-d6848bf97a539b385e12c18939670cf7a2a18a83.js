var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var InlineElements;module.link('../elements/InlineElements',{default:function(v){InlineElements=v}},1);

const UnorderedListBlock = ({ items }) => (_jsx("ul", { children: items.map((item, index) => (_jsx("li", { children: _jsx(InlineElements, { children: item.value }) }, index))) }));
module.exportDefault(UnorderedListBlock);
//# sourceMappingURL=UnorderedListBlock.js.map