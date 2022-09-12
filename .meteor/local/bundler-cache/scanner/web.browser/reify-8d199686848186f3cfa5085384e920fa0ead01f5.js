let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},0);let React,memo,useMemo;module.link('react',{default(v){React=v},memo(v){memo=v},useMemo(v){useMemo=v}},1);let Item;module.link('./ContextBlock.Item',{default(v){Item=v}},2);var __assign = (this && this.__assign) || function () {
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



var ContextBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var itemElements = useMemo(function () {
        return block.elements.map(function (element) { return (__assign(__assign({}, element), { appId: block.appId, blockId: block.blockId })); });
    }, [block.appId, block.blockId, block.elements]);
    return (React.createElement(Box, { className: className, display: 'flex', alignItems: 'center', margin: -4 }, itemElements.map(function (element, i) { return (React.createElement(Item, { key: i, block: element, surfaceRenderer: surfaceRenderer, index: i })); })));
};
module.exportDefault(memo(ContextBlock));
//# sourceMappingURL=ContextBlock.js.map