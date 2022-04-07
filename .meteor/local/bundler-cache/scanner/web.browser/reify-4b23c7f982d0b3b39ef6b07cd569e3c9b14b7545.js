module.export({isSectionBlockAccessoryElement:()=>isSectionBlockAccessoryElement});let BlockElementType;module.link('./BlockElementType',{BlockElementType(v){BlockElementType=v}},0);
var isSectionBlockAccessoryElement = function (block) {
    switch (block.type) {
        case BlockElementType.BUTTON:
        case BlockElementType.DATEPICKER:
        case BlockElementType.IMAGE:
        case BlockElementType.MULTI_STATIC_SELECT:
        case BlockElementType.OVERFLOW:
        case BlockElementType.STATIC_SELECT:
            return true;
        default:
            return false;
    }
};
//# sourceMappingURL=isSectionBlockAccessoryElement.js.map