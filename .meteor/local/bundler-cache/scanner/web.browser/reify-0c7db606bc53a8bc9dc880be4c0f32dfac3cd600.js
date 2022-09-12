module.export({isTextObject:()=>isTextObject});let TextObjectType;module.link('./TextObjectType',{TextObjectType(v){TextObjectType=v}},0);
var isTextObject = function (block) {
    return Object.values(TextObjectType).includes(block.type);
};
//# sourceMappingURL=isTextObject.js.map