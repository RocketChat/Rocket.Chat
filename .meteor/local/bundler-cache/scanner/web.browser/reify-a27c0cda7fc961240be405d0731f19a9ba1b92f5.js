module.export({SurfaceRenderer:()=>SurfaceRenderer});let LayoutBlockType;module.link('../blocks/LayoutBlockType',{LayoutBlockType(v){LayoutBlockType=v}},0);let TextObjectType;module.link('../blocks/TextObjectType',{TextObjectType(v){TextObjectType=v}},1);let isActionsBlockElement;module.link('../blocks/isActionsBlockElement',{isActionsBlockElement(v){isActionsBlockElement=v}},2);let isContextBlockElement;module.link('../blocks/isContextBlockElement',{isContextBlockElement(v){isContextBlockElement=v}},3);let isInputBlockElement;module.link('../blocks/isInputBlockElement',{isInputBlockElement(v){isInputBlockElement=v}},4);let isSectionBlockAccessoryElement;module.link('../blocks/isSectionBlockAccessoryElement',{isSectionBlockAccessoryElement(v){isSectionBlockAccessoryElement=v}},5);let isTextObject;module.link('../blocks/isTextObject',{isTextObject(v){isTextObject=v}},6);let isNotNull;module.link('../isNotNull',{isNotNull(v){isNotNull=v}},7);let BlockContext;module.link('./BlockContext',{BlockContext(v){BlockContext=v}},8);let renderBlockElement;module.link('./renderBlockElement',{renderBlockElement(v){renderBlockElement=v}},9);let renderLayoutBlock;module.link('./renderLayoutBlock',{renderLayoutBlock(v){renderLayoutBlock=v}},10);let renderTextObject;module.link('./renderTextObject',{renderTextObject(v){renderTextObject=v}},11);let resolveConditionalBlocks;module.link('./resolveConditionalBlocks',{resolveConditionalBlocks(v){resolveConditionalBlocks=v}},12);












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
            .flatMap(resolveConditionalBlocks(conditions))
            .filter(this.isAllowedLayoutBlock)
            .map(renderLayoutBlock(this))
            .filter(isNotNull);
    };
    SurfaceRenderer.prototype.renderTextObject = function (textObject, index, context) {
        return renderTextObject(this, context)(textObject, index);
    };
    SurfaceRenderer.prototype.renderActionsBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType.ACTIONS) === false &&
            !isActionsBlockElement(block)) {
            return null;
        }
        return renderBlockElement(this, BlockContext.ACTION)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderActions = function (element, _context, _, index) {
        return this.renderActionsBlockElement(element, index);
    };
    SurfaceRenderer.prototype.renderContextBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType.CONTEXT) === false &&
            !isContextBlockElement(block)) {
            return null;
        }
        if (isTextObject(block)) {
            return renderTextObject(this, BlockContext.CONTEXT)(block, index);
        }
        return renderBlockElement(this, BlockContext.CONTEXT)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderContext = function (element, _context, _, index) {
        return this.renderContextBlockElement(element, index);
    };
    SurfaceRenderer.prototype.renderInputBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType.INPUT) === false &&
            !isInputBlockElement(block)) {
            return null;
        }
        return renderBlockElement(this, BlockContext.FORM)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderInputs = function (element, _context, _, index) {
        return this.renderInputBlockElement(element, index);
    };
    SurfaceRenderer.prototype.renderSectionAccessoryBlockElement = function (block, index) {
        if (this.allowedLayoutBlockTypes.has(LayoutBlockType.SECTION) === false &&
            !isSectionBlockAccessoryElement(block)) {
            return null;
        }
        return renderBlockElement(this, BlockContext.SECTION)(block, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.renderAccessories = function (element, _context, _, index) {
        return this.renderSectionAccessoryBlockElement(element, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.plainText = function (element, context, index) {
        if (context === void 0) { context = BlockContext.NONE; }
        if (index === void 0) { index = 0; }
        return this[TextObjectType.PLAIN_TEXT](element, context, index);
    };
    /** @deprecated */
    SurfaceRenderer.prototype.text = function (textObject, context, index) {
        if (context === void 0) { context = BlockContext.NONE; }
        if (index === void 0) { index = 0; }
        switch (textObject.type) {
            case TextObjectType.PLAIN_TEXT:
                return this.plain_text(textObject, context, index);
            case TextObjectType.MRKDWN:
                return this.mrkdwn(textObject, context, index);
            default:
                return null;
        }
    };
    return SurfaceRenderer;
}());

//# sourceMappingURL=SurfaceRenderer.js.map