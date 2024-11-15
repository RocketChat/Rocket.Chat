let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let InlineElements;module.link('../elements/InlineElements',{default(v){InlineElements=v}},1);

const OrderedListBlock = ({ items }) => (_jsx("ol", { children: items.map(({ value, number }, index) => (_jsx("li", { value: number, children: _jsx(InlineElements, { children: value }) }, index))) }));
module.exportDefault(OrderedListBlock);
//# sourceMappingURL=OrderedListBlock.js.map