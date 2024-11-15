let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let IconButton,PositionAnimated,Options,useCursor;module.link('@rocket.chat/fuselage',{IconButton(v){IconButton=v},PositionAnimated(v){PositionAnimated=v},Options(v){Options=v},useCursor(v){useCursor=v}},1);let useRef,useCallback,useMemo;module.link('react',{useRef(v){useRef=v},useCallback(v){useCallback=v},useMemo(v){useMemo=v}},2);let useStringFromTextObject;module.link('../hooks/useStringFromTextObject',{useStringFromTextObject(v){useStringFromTextObject=v}},3);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},4);




const OverflowElement = ({ block, context, }) => {
    const [{ loading }, action] = useUiKitState(block, context);
    const fromTextObjectToString = useStringFromTextObject();
    const fireChange = useCallback(([value]) => action({ target: { value } }), [action]);
    const options = useMemo(() => block.options.map(({ value, text, url }) => {
        var _a;
        return [
            value,
            (_a = fromTextObjectToString(text)) !== null && _a !== void 0 ? _a : '',
            undefined,
            undefined,
            undefined,
            url,
        ];
    }), [block.options, fromTextObjectToString]);
    const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, (selectedOption, [, hide]) => {
        fireChange([selectedOption[0], selectedOption[1]]);
        reset();
        hide();
    });
    const ref = useRef(null);
    const onClick = useCallback(() => {
        var _a;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus();
        show();
    }, [show]);
    const handleSelection = useCallback(([value, _label, _selected, _type, url]) => {
        if (url) {
            window.open(url);
        }
        action({ target: { value: String(value) } });
        reset();
        hide();
    }, [action, hide, reset]);
    return (_jsxs(_Fragment, { children: [_jsx(IconButton, { ref: ref, small: true, onClick: onClick, onBlur: hide, onKeyUp: handleKeyUp, onKeyDown: handleKeyDown, disabled: loading, icon: 'kebab' }), _jsx(PositionAnimated, { width: 'auto', visible: visible, anchor: ref, placement: 'bottom-start', children: _jsx(Options, { onSelect: handleSelection, options: options, cursor: cursor }) })] }));
};
module.exportDefault(OverflowElement);
//# sourceMappingURL=OverflowElement.js.map