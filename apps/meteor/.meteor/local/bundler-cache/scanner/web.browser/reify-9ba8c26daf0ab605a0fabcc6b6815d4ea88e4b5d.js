let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let memo,useMemo;module.link('react',{memo(v){memo=v},useMemo(v){useMemo=v}},2);let Item;module.link('./ContextBlock.Item',{default(v){Item=v}},3);



const ContextBlock = ({ className, block, surfaceRenderer, }) => {
    const itemElements = useMemo(() => block.elements.map((element) => (Object.assign(Object.assign({}, element), { appId: block.appId, blockId: block.blockId }))), [block.appId, block.blockId, block.elements]);
    return (_jsx(Box, { className: className, display: 'flex', alignItems: 'center', margin: -4, children: itemElements.map((element, i) => (_jsx(Item, { block: element, surfaceRenderer: surfaceRenderer, index: i }, i))) }));
};
module.exportDefault(memo(ContextBlock));
//# sourceMappingURL=ContextBlock.js.map