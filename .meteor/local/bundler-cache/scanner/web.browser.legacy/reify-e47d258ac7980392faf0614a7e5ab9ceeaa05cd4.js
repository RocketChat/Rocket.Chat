"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConditionalBlocks = void 0;
var LayoutBlockType_1 = require("../blocks/LayoutBlockType");
var conditionsMatch = function (conditions, filters) {
    if (conditions === void 0) { conditions = undefined; }
    if (filters === void 0) { filters = {}; }
    if (!conditions) {
        return true;
    }
    if (Array.isArray(filters.engine) &&
        !filters.engine.includes(conditions.engine)) {
        return false;
    }
    return true;
};
var resolveConditionalBlocks = function (conditions) {
    return function (block) {
        if (block.type !== LayoutBlockType_1.LayoutBlockType.CONDITIONAL) {
            return [block];
        }
        if (conditionsMatch(conditions, block.when)) {
            return block.render;
        }
        return [];
    };
};
exports.resolveConditionalBlocks = resolveConditionalBlocks;
//# sourceMappingURL=resolveConditionalBlocks.js.map