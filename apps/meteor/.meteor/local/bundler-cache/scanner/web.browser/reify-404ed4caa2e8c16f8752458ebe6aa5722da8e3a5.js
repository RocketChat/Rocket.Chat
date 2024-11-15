let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Tabs;module.link('@rocket.chat/fuselage',{Tabs(v){Tabs=v}},1);let memo,useState;module.link('react',{memo(v){memo=v},useState(v){useState=v}},2);let TabElement;module.link('../elements/TabElement',{TabElement(v){TabElement=v}},3);



const TabNavigationBlock = (blockProps) => {
    const { block: { tabs }, context, surfaceRenderer, } = blockProps;
    const [selected, select] = useState();
    return (_jsx(Tabs, { marginBlock: 24, children: tabs.map((innerBlock, idx) => {
            if (selected !== undefined) {
                innerBlock.selected = idx === selected;
            }
            return (_jsx(TabElement, { index: idx, context: context, surfaceRenderer: surfaceRenderer, block: innerBlock, select: select }, `${innerBlock.blockId}_${idx}`));
        }) }));
};
module.exportDefault(memo(TabNavigationBlock));
//# sourceMappingURL=TabNavigationBlock.js.map