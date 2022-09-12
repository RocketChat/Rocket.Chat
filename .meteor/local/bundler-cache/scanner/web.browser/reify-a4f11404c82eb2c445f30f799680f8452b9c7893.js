let Field;module.link('@rocket.chat/fuselage',{Field(v){Field=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React,memo,useMemo;module.link('react',{default(v){React=v},memo(v){memo=v},useMemo(v){useMemo=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};




var InputBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer, context = _a.context;
    var inputElement = useMemo(function () {
        var _a, _b;
        return (__assign(__assign({}, block.element), { appId: (_a = block.element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = block.element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
    }, [block.element, block.appId, block.blockId]);
    var error = useUiKitState(inputElement, context)[0].error;
    return (React.createElement(Field, { className: className },
        block.label && (React.createElement(Field.Label, null, surfaceRenderer.renderTextObject(block.label, 0, UiKit.BlockContext.NONE))),
        React.createElement(Field.Row, null, surfaceRenderer.renderInputBlockElement(inputElement, 0)),
        error && React.createElement(Field.Error, null, error),
        block.hint && React.createElement(Field.Hint, null, block.hint)));
};
module.exportDefault(memo(InputBlock));
//# sourceMappingURL=InputBlock.js.map