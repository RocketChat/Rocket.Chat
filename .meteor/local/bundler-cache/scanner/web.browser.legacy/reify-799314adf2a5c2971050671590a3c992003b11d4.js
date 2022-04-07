"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isActionsBlockElement = void 0;
var BlockElementType_1 = require("./BlockElementType");
var isActionsBlockElement = function (block) {
    switch (block.type) {
        case BlockElementType_1.BlockElementType.BUTTON:
        case BlockElementType_1.BlockElementType.DATEPICKER:
        case BlockElementType_1.BlockElementType.LINEAR_SCALE:
        case BlockElementType_1.BlockElementType.MULTI_STATIC_SELECT:
        case BlockElementType_1.BlockElementType.OVERFLOW:
        case BlockElementType_1.BlockElementType.STATIC_SELECT:
            return true;
        default:
            return false;
    }
};
exports.isActionsBlockElement = isActionsBlockElement;
//# sourceMappingURL=isActionsBlockElement.js.map