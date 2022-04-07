module.export({isContextBlockElement:()=>isContextBlockElement});let BlockElementType;module.link('./BlockElementType',{BlockElementType(v){BlockElementType=v}},0);let TextObjectType;module.link('./TextObjectType',{TextObjectType(v){TextObjectType=v}},1);

var isContextBlockElement = function (block) {
    switch (block.type) {
        case BlockElementType.IMAGE:
        case TextObjectType.PLAIN_TEXT:
        case TextObjectType.MARKDOWN:
            return true;
        default:
            return false;
    }
};
//# sourceMappingURL=isContextBlockElement.js.map