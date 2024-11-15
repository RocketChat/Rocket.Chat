"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const react_1 = require("react");
const SectionBlock_Fields_1 = __importDefault(require("./SectionBlock.Fields"));
const SectionBlock = ({ className, block, surfaceRenderer, }) => {
    const { text, fields } = block;
    const accessoryElement = (0, react_1.useMemo)(() => block.accessory
        ? Object.assign({ appId: block.appId, blockId: block.blockId }, block.accessory) : undefined, [block.appId, block.blockId, block.accessory]);
    return ((0, jsx_runtime_1.jsxs)(fuselage_1.Grid, { className: className, children: [(0, jsx_runtime_1.jsxs)(fuselage_1.Grid.Item, { children: [text && ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { is: 'span', fontScale: 'p2', color: 'default', children: surfaceRenderer.text(text) })), fields && (0, jsx_runtime_1.jsx)(SectionBlock_Fields_1.default, { fields: fields, surfaceRenderer: surfaceRenderer })] }), block.accessory && ((0, jsx_runtime_1.jsx)(fuselage_1.Flex.Item, { grow: 0, children: (0, jsx_runtime_1.jsx)(fuselage_1.Grid.Item, { children: accessoryElement
                        ? surfaceRenderer.renderSectionAccessoryBlockElement(accessoryElement, 0)
                        : null }) }))] }));
};
exports.default = (0, react_1.memo)(SectionBlock);
//# sourceMappingURL=SectionBlock.js.map