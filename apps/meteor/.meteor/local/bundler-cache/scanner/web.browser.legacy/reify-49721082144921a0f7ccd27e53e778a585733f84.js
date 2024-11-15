var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var InlineElements;module.link('../elements/InlineElements',{default:function(v){InlineElements=v}},1);

const OrderedListBlock = ({ items }) => (_jsx("ol", { children: items.map(({ value, number }, index) => (_jsx("li", { value: number, children: _jsx(InlineElements, { children: value }) }, index))) }));
module.exportDefault(OrderedListBlock);
//# sourceMappingURL=OrderedListBlock.js.map