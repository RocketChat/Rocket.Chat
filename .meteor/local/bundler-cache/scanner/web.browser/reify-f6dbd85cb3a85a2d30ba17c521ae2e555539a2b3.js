let IconButton,PositionAnimated,Options,useCursor;module.link('@rocket.chat/fuselage',{IconButton(v){IconButton=v},PositionAnimated(v){PositionAnimated=v},Options(v){Options=v},useCursor(v){useCursor=v}},0);let React,useRef,useCallback,useMemo;module.link('react',{default(v){React=v},useRef(v){useRef=v},useCallback(v){useCallback=v},useMemo(v){useMemo=v}},1);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},2);let fromTextObjectToString;module.link('../utils/fromTextObjectToString',{fromTextObjectToString(v){fromTextObjectToString=v}},3);



var OverflowElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState(block, context), loading = _b[0].loading, action = _b[1];
    var fireChange = useCallback(function (_a) {
        var value = _a[0];
        return action({ target: { value: value } });
    }, [action]);
    var options = useMemo(function () {
        return block.options.map(function (_a, i) {
            var _b;
            var value = _a.value, text = _a.text, url = _a.url;
            return [
                value,
                (_b = fromTextObjectToString(surfaceRenderer, text, i)) !== null && _b !== void 0 ? _b : '',
                undefined,
                undefined,
                url,
            ];
        });
    }, [block.options, surfaceRenderer]);
    var _c = useCursor(-1, options, function (selectedOption, _a) {
        var hide = _a[1];
        fireChange([selectedOption[0], selectedOption[1]]);
        reset();
        hide();
    }), cursor = _c[0], handleKeyDown = _c[1], handleKeyUp = _c[2], reset = _c[3], _d = _c[4], visible = _d[0], hide = _d[1], show = _d[2];
    var ref = useRef(null);
    var onClick = useCallback(function () {
        var _a;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus();
        show();
    }, [show]);
    var handleSelection = useCallback(function (_a) {
        var value = _a[0], _label = _a[1], _selected = _a[2], _type = _a[3], url = _a[4];
        if (url) {
            window.open(url);
        }
        action({ target: { value: String(value) } });
        reset();
        hide();
    }, [action, hide, reset]);
    return (React.createElement(React.Fragment, null,
        React.createElement(IconButton, { ref: ref, small: true, onClick: onClick, onBlur: hide, onKeyUp: handleKeyUp, onKeyDown: handleKeyDown, disabled: loading, icon: 'kebab' }),
        React.createElement(PositionAnimated, { width: 'auto', visible: visible, anchor: ref, placement: 'bottom-start' },
            React.createElement(Options, { onSelect: handleSelection, options: options, cursor: cursor }))));
};
module.exportDefault(OverflowElement);
//# sourceMappingURL=OverflowElement.js.map