let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let MultiSelectFiltered;module.link('@rocket.chat/fuselage',{MultiSelectFiltered(v){MultiSelectFiltered=v}},1);let memo,useCallback,useMemo;module.link('react',{memo(v){memo=v},useCallback(v){useCallback=v},useMemo(v){useMemo=v}},2);let useStringFromTextObject;module.link('../hooks/useStringFromTextObject',{useStringFromTextObject(v){useStringFromTextObject=v}},3);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},4);




const MultiStaticSelectElement = ({ block, context, }) => {
    const [{ loading, value, error }, action] = useUiKitState(block, context);
    const fromTextObjectToString = useStringFromTextObject();
    const options = useMemo(() => block.options.map(({ value, text }) => {
        var _a;
        return [
            value,
            (_a = fromTextObjectToString(text)) !== null && _a !== void 0 ? _a : '',
        ];
    }), [block.options, fromTextObjectToString]);
    const handleChange = useCallback((value) => {
        action({ target: { value } });
    }, [action]);
    return (_jsx(MultiSelectFiltered, { value: value, disabled: loading, error: error, options: options, placeholder: fromTextObjectToString(block.placeholder), onChange: handleChange }));
};
module.exportDefault(memo(MultiStaticSelectElement));
//# sourceMappingURL=MultiStaticSelectElement.js.map