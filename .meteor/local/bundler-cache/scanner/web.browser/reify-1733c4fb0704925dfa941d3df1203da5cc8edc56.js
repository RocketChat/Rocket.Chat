let MultiSelectFiltered;module.link('@rocket.chat/fuselage',{MultiSelectFiltered(v){MultiSelectFiltered=v}},0);let React,memo,useCallback,useMemo;module.link('react',{default(v){React=v},memo(v){memo=v},useCallback(v){useCallback=v},useMemo(v){useMemo=v}},1);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},2);let fromTextObjectToString;module.link('../utils/fromTextObjectToString',{fromTextObjectToString(v){fromTextObjectToString=v}},3);



var MultiStaticSelectElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState(block, context), _c = _b[0], loading = _c.loading, value = _c.value, error = _c.error, action = _b[1];
    var options = useMemo(function () {
        return block.options.map(function (_a, i) {
            var _b;
            var value = _a.value, text = _a.text;
            return [
                value,
                (_b = fromTextObjectToString(surfaceRenderer, text, i)) !== null && _b !== void 0 ? _b : '',
            ];
        });
    }, [block.options, surfaceRenderer]);
    var handleChange = useCallback(function (value) {
        action({ target: { value: value } });
    }, [action]);
    return (React.createElement(MultiSelectFiltered, { value: value, disabled: loading, error: error, options: options, placeholder: fromTextObjectToString(surfaceRenderer, block.placeholder, 0), onChange: handleChange }));
};
module.exportDefault(memo(MultiStaticSelectElement));
//# sourceMappingURL=MultiStaticSelectElement.js.map