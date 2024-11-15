module.export({isInputBlockElement:()=>isInputBlockElement});let BlockElementType;module.link('./BlockElementType',{BlockElementType(v){BlockElementType=v}},0);
var isInputBlockElement = function (block) {
    switch (block.type) {
        case BlockElementType.CHANNELS_SELECT:
        case BlockElementType.CONVERSATIONS_SELECT:
        case BlockElementType.DATEPICKER:
        case BlockElementType.LINEAR_SCALE:
        case BlockElementType.MULTI_STATIC_SELECT:
        case BlockElementType.PLAIN_TEXT_INPUT:
        case BlockElementType.STATIC_SELECT:
        case BlockElementType.USERS_SELECT:
            return true;
        default:
            return false;
    }
};
//# sourceMappingURL=isInputBlockElement.js.map