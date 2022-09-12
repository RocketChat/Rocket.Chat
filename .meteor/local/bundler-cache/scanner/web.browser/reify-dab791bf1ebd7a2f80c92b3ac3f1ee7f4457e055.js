let InputBox;module.link('@rocket.chat/fuselage',{InputBox(v){InputBox=v}},0);let React;module.link('react',{default(v){React=v}},1);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},2);let fromTextObjectToString;module.link('../utils/fromTextObjectToString',{fromTextObjectToString(v){fromTextObjectToString=v}},3);



var DatePickerElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState(block, context), _c = _b[0], loading = _c.loading, value = _c.value, error = _c.error, action = _b[1];
    var actionId = block.actionId, placeholder = block.placeholder;
    return (React.createElement(InputBox, { type: 'date', error: error, value: value, disabled: loading, id: actionId, name: actionId, rows: 6, placeholder: placeholder
            ? fromTextObjectToString(surfaceRenderer, placeholder, 0)
            : undefined, onInput: action }));
};
module.exportDefault(DatePickerElement);
//# sourceMappingURL=DatePickerElement.js.map