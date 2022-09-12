module.export({resolveConditionalBlocks:()=>resolveConditionalBlocks});let LayoutBlockType;module.link('../blocks/LayoutBlockType',{LayoutBlockType(v){LayoutBlockType=v}},0);
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
        if (block.type !== LayoutBlockType.CONDITIONAL) {
            return [block];
        }
        if (conditionsMatch(conditions, block.when)) {
            return block.render;
        }
        return [];
    };
};
//# sourceMappingURL=resolveConditionalBlocks.js.map