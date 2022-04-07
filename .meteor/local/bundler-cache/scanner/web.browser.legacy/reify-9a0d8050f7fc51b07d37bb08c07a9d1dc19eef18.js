"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTextObject = void 0;
var TextObjectType_1 = require("./TextObjectType");
var isTextObject = function (block) {
    return Object.values(TextObjectType_1.TextObjectType).includes(block.type);
};
exports.isTextObject = isTextObject;
//# sourceMappingURL=isTextObject.js.map