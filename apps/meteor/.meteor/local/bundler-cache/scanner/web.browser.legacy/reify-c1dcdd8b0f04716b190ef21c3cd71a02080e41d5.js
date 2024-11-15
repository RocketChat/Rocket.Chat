"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractInitialStateFromLayout = void 0;
const getInitialValue_1 = require("./getInitialValue");
const hasElement_1 = require("./hasElement");
const hasElements_1 = require("./hasElements");
const isActionableElement = (element) => 'actionId' in element && typeof element.actionId === 'string';
const reduceInitialValuesFromLayoutBlock = (state, block) => {
    if ((0, hasElement_1.hasElement)(block)) {
        if (isActionableElement(block.element)) {
            state[block.element.actionId] = {
                value: (0, getInitialValue_1.getInitialValue)(block.element),
                blockId: block.blockId,
            };
        }
    }
    if ((0, hasElements_1.hasElements)(block)) {
        for (const element of block.elements) {
            if (isActionableElement(element)) {
                state[element.actionId] = {
                    value: (0, getInitialValue_1.getInitialValue)(element),
                    blockId: block.blockId,
                };
            }
        }
    }
    return state;
};
const extractInitialStateFromLayout = (blocks) => blocks.reduce(reduceInitialValuesFromLayoutBlock, {});
exports.extractInitialStateFromLayout = extractInitialStateFromLayout;
//# sourceMappingURL=extractInitialStateFromLayout.js.map