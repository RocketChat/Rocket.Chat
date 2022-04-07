"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurfaceRenderer = void 0;
var LayoutBlockType_1 = require("../blocks/LayoutBlockType");
var TextObjectType_1 = require("../blocks/TextObjectType");
var isActionsBlockElement_1 = require("../blocks/isActionsBlockElement");
var isContextBlockElement_1 = require("../blocks/isContextBlockElement");
var isInputBlockElement_1 = require("../blocks/isInputBlockElement");
var isSectionBlockAccessoryElement_1 = require("../blocks/isSectionBlockAccessoryElement");
var isTextObject_1 = require("../blocks/isTextObject");
var isNotNull_1 = require("../isNotNull");
var BlockContext_1 = require("./BlockContext");
var renderBlockElement_1 = require("./renderBlockElement");
var renderLayoutBlock_1 = require("./renderLayoutBlock");
var renderTextObject_1 = require("./renderTextObject");
var resolveConditionalBlocks_1 = require("./resolveConditionalBlocks");
var SurfaceRenderer = /** @class */ (function () {
    function SurfaceRenderer(allowedLayoutBlockTypes) {
        var _this = this;
        this.isAllowedLayoutBlock = function (block) {
            return _this.allowedLayoutBlockTypes.has(block.type);
        };
        this.allowedLayoutBlockTypes = new Set(allowedLayoutBlockTypes);
    }
    SurfaceRenderer.prototype.render = function (blocks, conditions) {
        if (!Array.isArray(blocks)) {
            return [];
        }
        return blocks
            .flatMap(resolveConditionalBlocks_1.resolveConditionalBlocks(conditions))
            .filter(this.isAllowedLayoutBlock)
            .map(renderLayoutBlock_1.renderLayoutBlock(this))
            .filter(isNotNull_1.isNotNull);
    };
    SurfaceRenderer.prototype.renderTextObject = function (textObject, index, context) {
        return renderTextObject_1.renderTextObject(this, context)(textObject, index);
    };
    SurfaceRenderer.prototype.renderActionsBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType_1.LayoutBlockType.ACTIONS) === false &&
            !isActionsBlockElement_1.isActionsBlockElement(block)) {
            return null;
        }
        return renderBlockElement_1.renderBlockElement(this, BlockContext_1.BlockContext.ACTION)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderActions = function (element, _context, _, index) {
        return this.renderActionsBlockElement(element, index);
    };
    SurfaceRenderer.prototype.renderContextBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType_1.LayoutBlockType.CONTEXT) === false &&
            !isContextBlockElement_1.isContextBlockElement(block)) {
            return null;
        }
        if (isTextObject_1.isTextObject(block)) {
            return renderTextObject_1.renderTextObject(this, BlockContext_1.BlockContext.CONTEXT)(block, index);
        }
        return renderBlockElement_1.renderBlockElement(this, BlockContext_1.BlockContext.CONTEXT)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderContext = function (element, _context, _, index) {
        return this.renderContextBlockElement(element, index);
    };
    SurfaceRenderer.prototype.renderInputBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType_1.LayoutBlockType.INPUT) === false &&
            !isInputBlockElement_1.isInputBlockElement(block)) {
            return null;
        }
        return renderBlockElement_1.renderBlockElement(this, BlockContext_1.BlockContext.FORM)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderInputs = function (element, _context, _, index) {
        return this.renderInputBlockElement(element, index);
    };
    SurfaceRenderer.prototype.renderSectionAccessoryBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType_1.LayoutBlockType.SECTION) === false &&
            !isSectionBlockAccessoryElement_1.isSectionBlockAccessoryElement(block)) {
            return null;
        }
        return renderBlockElement_1.renderBlockElement(this, BlockContext_1.BlockContext.SECTION)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderAccessories = function (element, _context, _, index) {
        return this.renderSectionAccessoryBlockElement(element, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.plainText = function (element, context, index) {
        if (context === void 0) { context = BlockContext_1.BlockContext.NONE; }
        if (index === void 0) { index = 0; }
        return this[TextObjectType_1.TextObjectType.PLAIN_TEXT](element, context, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.text = function (textObject, context, index) {
        if (context === void 0) { context = BlockContext_1.BlockContext.NONE; }
        if (index === void 0) { index = 0; }
        switch (textObject.type) {
            case TextObjectType_1.TextObjectType.PLAIN_TEXT:
                return this.plain_text(textObject, context, index);
            case TextObjectType_1.TextObjectType.MRKDWN:
                return this.mrkdwn(textObject, context, index);
            default:
                return null;
        }
    };
    return SurfaceRenderer;
}());
exports.SurfaceRenderer = SurfaceRenderer;
//# sourceMappingURL=SurfaceRenderer.js.map