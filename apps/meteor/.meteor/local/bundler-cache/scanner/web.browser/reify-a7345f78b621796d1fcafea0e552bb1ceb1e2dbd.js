module.export({TabElement:()=>TabElement},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let TabsItem;module.link('@rocket.chat/fuselage',{TabsItem(v){TabsItem=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



const TabElement = ({ block, context, surfaceRenderer, index, select, }) => {
    const [{ loading }, action] = useUiKitState(block, context);
    const { title, selected, disabled } = block;
    return (_jsx(TabsItem, { selected: selected, disabled: loading ? true : disabled, onClick: (e) => {
            !disabled && select(index);
            !disabled && action(e);
        }, children: surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE) }));
};
//# sourceMappingURL=TabElement.js.map