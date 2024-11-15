let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let InputBox;module.link('@rocket.chat/fuselage',{InputBox(v){InputBox=v}},1);let useStringFromTextObject;module.link('../hooks/useStringFromTextObject',{useStringFromTextObject(v){useStringFromTextObject=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



const DatePickerElement = ({ block, context, }) => {
    const [{ loading, value, error }, action] = useUiKitState(block, context);
    const { actionId, placeholder } = block;
    const fromTextObjectToString = useStringFromTextObject();
    return (_jsx(InputBox, { type: 'date', error: error, value: value, disabled: loading, id: actionId, name: actionId, rows: 6, placeholder: fromTextObjectToString(placeholder), onInput: action }));
};
module.exportDefault(DatePickerElement);
//# sourceMappingURL=DatePickerElement.js.map