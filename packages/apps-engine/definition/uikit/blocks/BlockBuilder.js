"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockBuilder = void 0;
const uuid_1 = require("uuid");
const Blocks_1 = require("./Blocks");
const Elements_1 = require("./Elements");
const Objects_1 = require("./Objects");
/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
class BlockBuilder {
    constructor(appId) {
        this.appId = appId;
        this.blocks = [];
    }
    addSectionBlock(block) {
        this.addBlock(Object.assign({ type: Blocks_1.BlockType.SECTION }, block));
        return this;
    }
    addImageBlock(block) {
        this.addBlock(Object.assign({ type: Blocks_1.BlockType.IMAGE }, block));
        return this;
    }
    addDividerBlock() {
        this.addBlock({ type: Blocks_1.BlockType.DIVIDER });
        return this;
    }
    addActionsBlock(block) {
        this.addBlock(Object.assign({ type: Blocks_1.BlockType.ACTIONS }, block));
        return this;
    }
    addContextBlock(block) {
        this.addBlock(Object.assign({ type: Blocks_1.BlockType.CONTEXT }, block));
        return this;
    }
    addInputBlock(block) {
        this.addBlock(Object.assign({ type: Blocks_1.BlockType.INPUT }, block));
        return this;
    }
    addConditionalBlock(innerBlocks, condition) {
        const render = innerBlocks instanceof BlockBuilder ? innerBlocks.getBlocks() : innerBlocks;
        this.addBlock({ type: Blocks_1.BlockType.CONDITIONAL, render, when: condition });
        return this;
    }
    getBlocks() {
        return this.blocks;
    }
    newPlainTextObject(text, emoji = false) {
        return {
            type: Objects_1.TextObjectType.PLAINTEXT,
            text,
            emoji,
        };
    }
    newMarkdownTextObject(text) {
        return {
            type: Objects_1.TextObjectType.MARKDOWN,
            text,
        };
    }
    newButtonElement(info) {
        return this.newInteractiveElement(Object.assign({ type: Elements_1.BlockElementType.BUTTON }, info));
    }
    newImageElement(info) {
        return Object.assign({ type: Elements_1.BlockElementType.IMAGE }, info);
    }
    newOverflowMenuElement(info) {
        return this.newInteractiveElement(Object.assign({ type: Elements_1.BlockElementType.OVERFLOW_MENU }, info));
    }
    newPlainTextInputElement(info) {
        return this.newInputElement(Object.assign({ type: Elements_1.BlockElementType.PLAIN_TEXT_INPUT }, info));
    }
    newStaticSelectElement(info) {
        return this.newSelectElement(Object.assign({ type: Elements_1.BlockElementType.STATIC_SELECT }, info));
    }
    newMultiStaticElement(info) {
        return this.newSelectElement(Object.assign({ type: Elements_1.BlockElementType.MULTI_STATIC_SELECT }, info));
    }
    newInteractiveElement(element) {
        if (!element.actionId) {
            element.actionId = this.generateActionId();
        }
        return element;
    }
    newInputElement(element) {
        if (!element.actionId) {
            element.actionId = this.generateActionId();
        }
        return element;
    }
    newSelectElement(element) {
        if (!element.actionId) {
            element.actionId = this.generateActionId();
        }
        return element;
    }
    addBlock(block) {
        if (!block.blockId) {
            block.blockId = this.generateBlockId();
        }
        block.appId = this.appId;
        this.blocks.push(block);
    }
    generateBlockId() {
        return (0, uuid_1.v1)();
    }
    generateActionId() {
        return (0, uuid_1.v1)();
    }
}
exports.BlockBuilder = BlockBuilder;
//# sourceMappingURL=BlockBuilder.js.map