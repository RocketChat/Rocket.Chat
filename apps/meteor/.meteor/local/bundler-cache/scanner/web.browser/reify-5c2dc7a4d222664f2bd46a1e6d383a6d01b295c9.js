let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let CheckBox,Box;module.link('@rocket.chat/fuselage',{CheckBox(v){CheckBox=v},Box(v){Box=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



const CheckboxElement = ({ block, context, surfaceRenderer, }) => {
    const [{ loading, value }, action] = useUiKitState(block, context);
    const { options } = block;
    return (_jsx(Box, { children: options.map((option) => {
            const isChecked = value === null || value === void 0 ? void 0 : value.includes(option.value);
            return (_jsxs(Box, { pb: 4, children: [_jsx(CheckBox, { disabled: loading, value: option.value, checked: isChecked, onChange: action }), _jsx(Box, { is: 'label', pis: 8, children: surfaceRenderer.renderTextObject(option.text, 0, UiKit.BlockContext.NONE) })] }, option.value));
        }) }));
};
module.exportDefault(CheckboxElement);
//# sourceMappingURL=CheckboxElement.js.map