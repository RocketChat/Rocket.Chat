let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Button,ButtonGroup;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v},ButtonGroup(v){ButtonGroup=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let memo,useMemo;module.link('react',{memo(v){memo=v},useMemo(v){useMemo=v}},3);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},4);




const LinearScaleElement = ({ className, block, context, surfaceRenderer, }) => {
    const { minValue = 0, maxValue = 10, initialValue, preLabel, postLabel, } = block;
    const [{ loading, value = initialValue, error }, action] = useUiKitState(block, context);
    const points = useMemo(() => Array.from({ length: Math.max(maxValue - minValue + 1, 1) }, (_, i) => String(minValue + i)), [maxValue, minValue]);
    return (_jsxs(Box, { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', children: [preLabel && (_jsx(Box, { fontScale: 'c2', paddingInlineEnd: 8, textAlign: 'start', children: surfaceRenderer.renderTextObject(preLabel, 0, UiKit.BlockContext.NONE) })), _jsx(Box, { children: _jsx(ButtonGroup, { className: className, align: 'center', children: points.map((point, i) => (_jsx(Button, { className: point === String(value) ? 'active' : undefined, disabled: loading, danger: !!error, minWidth: '4ch', small: true, value: point, marginInline: 2, flexShrink: 1, onClick: action, children: surfaceRenderer.renderTextObject({
                            type: 'plain_text',
                            text: String(i + minValue),
                        }, 0, UiKit.BlockContext.NONE) }, i))) }) }), postLabel && (_jsx(Box, { fontScale: 'c2', paddingInlineStart: 8, textAlign: 'end', children: surfaceRenderer.renderTextObject(postLabel, 0, UiKit.BlockContext.NONE) }))] }));
};
module.exportDefault(memo(LinearScaleElement));
//# sourceMappingURL=LinearScaleElement.js.map