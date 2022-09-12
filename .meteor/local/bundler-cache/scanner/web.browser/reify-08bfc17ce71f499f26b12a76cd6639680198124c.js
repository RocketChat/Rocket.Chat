let TextAreaInput,TextInput;module.link('@rocket.chat/fuselage',{TextAreaInput(v){TextAreaInput=v},TextInput(v){TextInput=v}},0);let React,memo;module.link('react',{default(v){React=v},memo(v){memo=v}},1);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},2);let fromTextObjectToString;module.link('../utils/fromTextObjectToString',{fromTextObjectToString(v){fromTextObjectToString=v}},3);



var PlainTextInputElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState(block, context), _c = _b[0], loading = _c.loading, value = _c.value, error = _c.error, action = _b[1];
    if (block.multiline) {
        return (React.createElement(TextAreaInput, { disabled: loading, id: block.actionId, name: block.actionId, rows: 6, error: error, value: value, onChange: action, placeholder: block.placeholder
                ? fromTextObjectToString(surfaceRenderer, block.placeholder, 0)
                : undefined }));
    }
    return (React.createElement(TextInput, { disabled: loading, id: block.actionId, name: block.actionId, error: error, value: value, onChange: action, placeholder: block.placeholder
            ? fromTextObjectToString(surfaceRenderer, block.placeholder, 0)
            : undefined }));
};
module.exportDefault(memo(PlainTextInputElement));
//# sourceMappingURL=PlainTextInputElement.js.map