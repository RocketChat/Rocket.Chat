"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isContextBlockElement = void 0;
var BlockElementType_1 = require("./BlockElementType");
var TextObjectType_1 = require("./TextObjectType");
var isContextBlockElement = function (block) {
    switch (block.type) {
        case BlockElementType_1.BlockElementType.IMAGE:
        case TextObjectType_1.TextObjectType.PLAIN_TEXT:
        case TextObjectType_1.TextObjectType.MARKDOWN:
            return true;
        default:
            return false;
    }
};
exports.isContextBlockElement = isContextBlockElement;
//# sourceMappingURL=isContextBlockElement.js.map