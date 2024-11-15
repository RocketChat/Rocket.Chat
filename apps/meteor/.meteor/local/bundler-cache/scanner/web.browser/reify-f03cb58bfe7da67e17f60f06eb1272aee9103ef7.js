module.export({isActionsBlockElement:()=>isActionsBlockElement});let BlockElementType;module.link('./BlockElementType',{BlockElementType(v){BlockElementType=v}},0);
var isActionsBlockElement = function (block) {
    switch (block.type) {
        case BlockElementType.BUTTON:
        case BlockElementType.DATEPICKER:
        case BlockElementType.LINEAR_SCALE:
        case BlockElementType.MULTI_STATIC_SELECT:
        case BlockElementType.OVERFLOW:
        case BlockElementType.STATIC_SELECT:
        case BlockElementType.TOGGLE_SWITCH:
        case BlockElementType.CHECKBOX:
        case BlockElementType.RADIO_BUTTON:
        case BlockElementType.TIME_PICKER:
            return true;
        default:
            return false;
    }
};
//# sourceMappingURL=isActionsBlockElement.js.map