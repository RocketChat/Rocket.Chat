"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const react_1 = require("react");
const ContextBlock_Item_1 = __importDefault(require("./ContextBlock.Item"));
const ContextBlock = ({ className, block, surfaceRenderer, }) => {
    const itemElements = (0, react_1.useMemo)(() => block.elements.map((element) => (Object.assign(Object.assign({}, element), { appId: block.appId, blockId: block.blockId }))), [block.appId, block.blockId, block.elements]);
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { className: className, display: 'flex', alignItems: 'center', margin: -4, children: itemElements.map((element, i) => ((0, jsx_runtime_1.jsx)(ContextBlock_Item_1.default, { block: element, surfaceRenderer: surfaceRenderer, index: i }, i))) }));
};
exports.default = (0, react_1.memo)(ContextBlock);
//# sourceMappingURL=ContextBlock.js.map