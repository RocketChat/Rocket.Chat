let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,RadioButton;module.link('@rocket.chat/fuselage',{Box(v){Box=v},RadioButton(v){RadioButton=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



const RadioButtonElement = ({ block, context, surfaceRenderer, }) => {
    const [{ loading, value }, action] = useUiKitState(block, context);
    const { options } = block;
    return (_jsx(Box, { children: options.map((option) => {
            return (_jsxs(Box, { pb: 4, children: [_jsx(RadioButton, { disabled: loading, checked: value === option.value, value: option.value, onChange: action }), _jsx(Box, { is: 'label', pis: 8, children: surfaceRenderer.renderTextObject(option.text, 0, UiKit.BlockContext.NONE) })] }, option.value));
        }) }));
};
module.exportDefault(RadioButtonElement);
//# sourceMappingURL=RadioButtonElement.js.map