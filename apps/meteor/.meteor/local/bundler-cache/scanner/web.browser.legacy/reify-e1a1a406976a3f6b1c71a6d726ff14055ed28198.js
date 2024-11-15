"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const react_1 = require("react");
const TabElement_1 = require("../elements/TabElement");
const TabNavigationBlock = (blockProps) => {
    const { block: { tabs }, context, surfaceRenderer, } = blockProps;
    const [selected, select] = (0, react_1.useState)();
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Tabs, { marginBlock: 24, children: tabs.map((innerBlock, idx) => {
            if (selected !== undefined) {
                innerBlock.selected = idx === selected;
            }
            return ((0, jsx_runtime_1.jsx)(TabElement_1.TabElement, { index: idx, context: context, surfaceRenderer: surfaceRenderer, block: innerBlock, select: select }, `${innerBlock.blockId}_${idx}`));
        }) }));
};
exports.default = (0, react_1.memo)(TabNavigationBlock);
//# sourceMappingURL=TabNavigationBlock.js.map