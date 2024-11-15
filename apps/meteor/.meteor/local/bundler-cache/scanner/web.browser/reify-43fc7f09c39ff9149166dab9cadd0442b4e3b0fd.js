let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Flex,Grid;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Flex(v){Flex=v},Grid(v){Grid=v}},1);let memo,useMemo;module.link('react',{memo(v){memo=v},useMemo(v){useMemo=v}},2);let Fields;module.link('./SectionBlock.Fields',{default(v){Fields=v}},3);



const SectionBlock = ({ className, block, surfaceRenderer, }) => {
    const { text, fields } = block;
    const accessoryElement = useMemo(() => block.accessory
        ? Object.assign({ appId: block.appId, blockId: block.blockId }, block.accessory) : undefined, [block.appId, block.blockId, block.accessory]);
    return (_jsxs(Grid, { className: className, children: [_jsxs(Grid.Item, { children: [text && (_jsx(Box, { is: 'span', fontScale: 'p2', color: 'default', children: surfaceRenderer.text(text) })), fields && _jsx(Fields, { fields: fields, surfaceRenderer: surfaceRenderer })] }), block.accessory && (_jsx(Flex.Item, { grow: 0, children: _jsx(Grid.Item, { children: accessoryElement
                        ? surfaceRenderer.renderSectionAccessoryBlockElement(accessoryElement, 0)
                        : null }) }))] }));
};
module.exportDefault(memo(SectionBlock));
//# sourceMappingURL=SectionBlock.js.map