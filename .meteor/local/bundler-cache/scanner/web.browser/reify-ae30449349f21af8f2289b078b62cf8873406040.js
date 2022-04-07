let Box,Button;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Button(v){Button=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React,memo,useCallback,useMemo,useState;module.link('react',{default(v){React=v},memo(v){memo=v},useCallback(v){useCallback=v},useMemo(v){useMemo=v},useState(v){useState=v}},2);let useSurfaceType;module.link('../contexts/SurfaceContext',{useSurfaceType(v){useSurfaceType=v}},3);let Action;module.link('./ActionsBlock.Action',{default(v){Action=v}},4);var __assign = (this && this.__assign) || function () {
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





var ActionsBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var surfaceType = useSurfaceType();
    var _b = useState(function () { return block.elements.length > 5 && surfaceType !== 'banner'; }), showMoreVisible = _b[0], setShowMoreVisible = _b[1];
    var handleShowMoreClick = useCallback(function () {
        setShowMoreVisible(false);
    }, []);
    var actionElements = useMemo(function () {
        return (showMoreVisible ? block.elements.slice(0, 5) : block.elements).map(function (element) {
            var _a, _b;
            return (__assign(__assign({}, element), { appId: (_a = element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
        });
    }, [block.appId, block.blockId, block.elements, showMoreVisible]);
    return (React.createElement(Box, { className: className, display: 'flex', flexWrap: 'wrap', margin: -4 },
        actionElements.map(function (element, i) { return (React.createElement(Action, { key: i, element: element, parser: surfaceRenderer, index: i })); }),
        showMoreVisible && (React.createElement(Box, { display: 'flex', margin: 4 },
            React.createElement(Button, { small: true, onClick: handleShowMoreClick }, surfaceRenderer.renderTextObject({ type: 'plain_text', text: 'Show more...' }, 0, UiKit.BlockContext.NONE))))));
};
module.exportDefault(memo(ActionsBlock));
//# sourceMappingURL=ActionsBlock.js.map