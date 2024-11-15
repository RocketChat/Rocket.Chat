let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let TextAreaInput,TextInput;module.link('@rocket.chat/fuselage',{TextAreaInput(v){TextAreaInput=v},TextInput(v){TextInput=v}},1);let memo;module.link('react',{memo(v){memo=v}},2);let useStringFromTextObject;module.link('../hooks/useStringFromTextObject',{useStringFromTextObject(v){useStringFromTextObject=v}},3);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},4);




const PlainTextInputElement = ({ block, context, }) => {
    const [{ loading, value, error }, action] = useUiKitState(block, context);
    const fromTextObjectToString = useStringFromTextObject();
    if (block.multiline) {
        return (_jsx(TextAreaInput, { disabled: loading, id: block.actionId, name: block.actionId, rows: 6, error: error, value: value, onChange: action, placeholder: fromTextObjectToString(block.placeholder) }));
    }
    return (_jsx(TextInput, { disabled: loading, id: block.actionId, name: block.actionId, error: error, value: value, onChange: action, placeholder: fromTextObjectToString(block.placeholder) }));
};
module.exportDefault(memo(PlainTextInputElement));
//# sourceMappingURL=PlainTextInputElement.js.map