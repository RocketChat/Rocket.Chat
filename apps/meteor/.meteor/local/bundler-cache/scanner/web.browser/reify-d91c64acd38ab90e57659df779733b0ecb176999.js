let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,ToggleSwitch;module.link('@rocket.chat/fuselage',{Box(v){Box=v},ToggleSwitch(v){ToggleSwitch=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



const ToggleSwitchElement = ({ block, context, surfaceRenderer, }) => {
    const [{ value, loading }, action] = useUiKitState(block, context);
    const { options } = block;
    return (_jsx(Box, { children: options.map((option) => {
            const isChecked = value.includes(option.value);
            return (_jsxs(Box, { pb: 4, children: [_jsx(ToggleSwitch, { disabled: loading, value: option.value, checked: isChecked, onChange: action }), _jsx(Box, { is: 'label', pis: 8, children: surfaceRenderer.renderTextObject(option.text, 0, UiKit.BlockContext.NONE) })] }, option.value));
        }) }));
};
module.exportDefault(ToggleSwitchElement);
//# sourceMappingURL=ToggleSwitchElement.js.map