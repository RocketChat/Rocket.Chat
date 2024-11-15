let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Field,FieldLabel,FieldRow,FieldError,FieldHint;module.link('@rocket.chat/fuselage',{Field(v){Field=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v},FieldHint(v){FieldHint=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let memo,useMemo;module.link('react',{memo(v){memo=v},useMemo(v){useMemo=v}},3);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},4);




const InputBlock = ({ className, block, surfaceRenderer, context, }) => {
    const inputElement = useMemo(() => {
        var _a, _b;
        return (Object.assign(Object.assign({}, block.element), { appId: (_a = block.element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = block.element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
    }, [block.element, block.appId, block.blockId]);
    const [{ error }] = useUiKitState(inputElement, context);
    return (_jsxs(Field, { className: className, children: [block.label && (_jsx(FieldLabel, { children: surfaceRenderer.renderTextObject(block.label, 0, UiKit.BlockContext.NONE) })), _jsx(FieldRow, { children: surfaceRenderer.renderInputBlockElement(inputElement, 0) }), error && _jsx(FieldError, { children: error }), block.hint && (_jsx(FieldHint, { children: surfaceRenderer.renderTextObject(block.hint, 0, UiKit.BlockContext.NONE) }))] }));
};
module.exportDefault(memo(InputBlock));
//# sourceMappingURL=InputBlock.js.map