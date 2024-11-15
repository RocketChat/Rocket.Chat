let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Button;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let memo,useCallback,useMemo,useState;module.link('react',{memo(v){memo=v},useCallback(v){useCallback=v},useMemo(v){useMemo=v},useState(v){useState=v}},3);let useSurfaceType;module.link('../hooks/useSurfaceType',{useSurfaceType(v){useSurfaceType=v}},4);let Action;module.link('./ActionsBlock.Action',{default(v){Action=v}},5);





const ActionsBlock = ({ className, block, surfaceRenderer, }) => {
    const surfaceType = useSurfaceType();
    const [showMoreVisible, setShowMoreVisible] = useState(() => block.elements.length > 5 && surfaceType !== 'banner');
    const handleShowMoreClick = useCallback(() => {
        setShowMoreVisible(false);
    }, []);
    const actionElements = useMemo(() => (showMoreVisible ? block.elements.slice(0, 5) : block.elements).map((element) => {
        var _a, _b;
        return (Object.assign(Object.assign({}, element), { appId: (_a = element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
    }), [block.appId, block.blockId, block.elements, showMoreVisible]);
    return (_jsxs(Box, { className: className, display: 'flex', flexWrap: 'wrap', margin: -4, children: [actionElements.map((element, i) => (_jsx(Action, { element: element, parser: surfaceRenderer, index: i }, i))), showMoreVisible && (_jsx(Box, { display: 'flex', margin: 4, children: _jsx(Button, { small: true, onClick: handleShowMoreClick, children: surfaceRenderer.renderTextObject({ type: 'plain_text', text: 'Show more...' }, 0, UiKit.BlockContext.NONE) }) }))] }));
};
module.exportDefault(memo(ActionsBlock));
//# sourceMappingURL=ActionsBlock.js.map