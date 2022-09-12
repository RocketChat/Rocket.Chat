let Box,Flex,Grid;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Flex(v){Flex=v},Grid(v){Grid=v}},0);let React,memo,useMemo;module.link('react',{default(v){React=v},memo(v){memo=v},useMemo(v){useMemo=v}},1);let Fields;module.link('./SectionBlock.Fields',{default(v){Fields=v}},2);var __assign = (this && this.__assign) || function () {
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



var SectionBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var text = block.text, fields = block.fields;
    var accessoryElement = useMemo(function () {
        return block.accessory
            ? __assign({ appId: block.appId, blockId: block.blockId }, block.accessory) : undefined;
    }, [block.appId, block.blockId, block.accessory]);
    return (React.createElement(Grid, { className: className },
        React.createElement(Grid.Item, null,
            text && (React.createElement(Box, { is: 'span', fontScale: 'p2', color: 'default' }, surfaceRenderer.text(text))),
            fields && React.createElement(Fields, { fields: fields, surfaceRenderer: surfaceRenderer })),
        block.accessory && (React.createElement(Flex.Item, { grow: 0 },
            React.createElement(Grid.Item, null, accessoryElement
                ? surfaceRenderer.renderSectionAccessoryBlockElement(accessoryElement, 0)
                : null)))));
};
module.exportDefault(memo(SectionBlock));
//# sourceMappingURL=SectionBlock.js.map