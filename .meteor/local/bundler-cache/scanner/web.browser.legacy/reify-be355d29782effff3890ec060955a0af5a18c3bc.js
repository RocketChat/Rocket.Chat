"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var fuselage_1 = require("@rocket.chat/fuselage");
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var ui_kit_1 = require("@rocket.chat/ui-kit");
var react_1 = __importStar(require("react"));
var ContextBlock_1 = __importDefault(require("./ContextBlock"));
var PreviewBlock = function (_a) {
    var _b;
    var block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    return (react_1.default.createElement(fuselage_1.Box, null,
        react_1.default.createElement(fuselage_1.MessageGenericPreview, null,
            ui_kit_1.isPreviewBlockWithPreview(block) && ((_b = block.preview) === null || _b === void 0 ? void 0 : _b.dimensions) && (react_1.default.createElement(fuselage_1.MessageGenericPreviewImage, { width: block.preview.dimensions.width, height: block.preview.dimensions.height, url: block.preview.url })),
            react_1.default.createElement(fuselage_1.MessageGenericPreviewContent, { thumb: ui_kit_1.isPreviewBlockWithThumb(block) ? (react_1.default.createElement(fuselage_1.MessageGenericPreviewThumb, null,
                    react_1.default.createElement(fuselage_1.MessageGenericPreviewImage, { height: 192, width: 368, url: block.thumb.url }))) : undefined },
                Array.isArray(block.title) ? (react_1.default.createElement(fuselage_1.MessageGenericPreviewTitle, { externalUrl: ui_kit_1.isPreviewBlockWithPreview(block) ? block.externalUrl : undefined }, block.title.map(function (title) {
                    return surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE);
                }))) : null,
                Array.isArray(block.description) ? (react_1.default.createElement(fuselage_1.MessageGenericPreviewDescription, { clamp: true }, block.description.map(function (description) {
                    return surfaceRenderer.renderTextObject(description, 0, UiKit.BlockContext.NONE);
                }))) : null,
                block.footer && (react_1.default.createElement(fuselage_1.MessageGenericPreviewFooter, null,
                    react_1.default.createElement(ContextBlock_1.default, { block: block.footer, surfaceRenderer: surfaceRenderer, context: UiKit.BlockContext.BLOCK, index: 0 })))))));
};
exports.default = react_1.memo(PreviewBlock);
//# sourceMappingURL=PreviewBlock.js.map