"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const ui_kit_1 = require("@rocket.chat/ui-kit");
const react_1 = require("react");
const ContextBlock_1 = __importDefault(require("./ContextBlock"));
const PreviewBlock = ({ block, surfaceRenderer, }) => {
    var _a;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.MessageGenericPreview, { children: [(0, ui_kit_1.isPreviewBlockWithPreview)(block) && ((_a = block.preview) === null || _a === void 0 ? void 0 : _a.dimensions) && ((0, jsx_runtime_1.jsx)(fuselage_1.MessageGenericPreviewCoverImage, { width: block.preview.dimensions.width, height: block.preview.dimensions.height, url: block.preview.url })), (0, jsx_runtime_1.jsxs)(fuselage_1.MessageGenericPreviewContent, { thumb: (0, ui_kit_1.isPreviewBlockWithThumb)(block) ? ((0, jsx_runtime_1.jsx)(fuselage_1.MessageGenericPreviewThumb, { children: (0, jsx_runtime_1.jsx)(fuselage_1.MessageGenericPreviewCoverImage, { height: 192, width: 368, url: block.thumb.url }) })) : undefined, children: [Array.isArray(block.title) ? ((0, jsx_runtime_1.jsx)(fuselage_1.MessageGenericPreviewTitle, { externalUrl: (0, ui_kit_1.isPreviewBlockWithPreview)(block) ? block.externalUrl : undefined, children: block.title.map((title) => surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE)) })) : null, Array.isArray(block.description) ? ((0, jsx_runtime_1.jsx)(fuselage_1.MessageGenericPreviewDescription, { clamp: true, children: block.description.map((description) => surfaceRenderer.renderTextObject(description, 0, UiKit.BlockContext.NONE)) })) : null, block.footer && ((0, jsx_runtime_1.jsx)(fuselage_1.MessageGenericPreviewFooter, { children: (0, jsx_runtime_1.jsx)(ContextBlock_1.default, { block: block.footer, surfaceRenderer: surfaceRenderer, context: UiKit.BlockContext.BLOCK, index: 0 }) }))] })] }) }));
};
exports.default = (0, react_1.memo)(PreviewBlock);
//# sourceMappingURL=PreviewBlock.js.map