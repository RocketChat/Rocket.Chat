let Box,Button,ButtonGroup;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v},ButtonGroup(v){ButtonGroup=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React,memo,useMemo;module.link('react',{default(v){React=v},memo(v){memo=v},useMemo(v){useMemo=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



var LinearScaleElement = function (_a) {
    var className = _a.className, block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = block.minValue, minValue = _b === void 0 ? 0 : _b, _c = block.maxValue, maxValue = _c === void 0 ? 10 : _c, initialValue = block.initialValue, preLabel = block.preLabel, postLabel = block.postLabel;
    var _d = useUiKitState(block, context), _e = _d[0], loading = _e.loading, _f = _e.value, value = _f === void 0 ? initialValue : _f, error = _e.error, action = _d[1];
    var points = useMemo(function () {
        return Array.from({ length: Math.max(maxValue - minValue + 1, 1) }, function (_, i) {
            return String(minValue + i);
        });
    }, [maxValue, minValue]);
    return (React.createElement(Box, { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' },
        preLabel && (React.createElement(Box, { fontScale: 'c2', paddingInlineEnd: 8, textAlign: 'start' }, surfaceRenderer.renderTextObject(preLabel, 0, UiKit.BlockContext.NONE))),
        React.createElement(Box, null,
            React.createElement(ButtonGroup, { className: className, align: 'center', marginInline: -2, minWidth: 0 }, points.map(function (point, i) { return (React.createElement(Button, { key: i, className: point === String(value) ? 'active' : undefined, disabled: loading, danger: !!error, minWidth: '4ch', small: true, value: point, marginInline: 2, flexShrink: 1, onClick: action }, surfaceRenderer.renderTextObject({
                type: 'plain_text',
                text: String(i + minValue),
            }, 0, UiKit.BlockContext.NONE))); }))),
        postLabel && (React.createElement(Box, { fontScale: 'c2', paddingInlineStart: 8, textAlign: 'end' }, surfaceRenderer.renderTextObject(postLabel, 0, UiKit.BlockContext.NONE)))));
};
module.exportDefault(memo(LinearScaleElement));
//# sourceMappingURL=LinearScaleElement.js.map