module.export({handlers:()=>handlers},true);let unknownError;module.link("./unknown-error/index.js",{prettify(v){unknownError=v}},0);let additionalProperties;module.link("./additional-properties/index.js",{prettify(v){additionalProperties=v}},1);let anyOf;module.link("./any-of/index.js",{prettify(v){anyOf=v}},2);let arraySize;module.link("./array-size/index.js",{prettify(v){arraySize=v}},3);let comparison;module.link("./comparison/index.js",{prettify(v){comparison=v}},4);let _enum;module.link("./enum/index.js",{prettify(v){_enum=v}},5);let format;module.link("./format/index.js",{prettify(v){format=v}},6);let ifThenElse;module.link("./if-then-else/index.js",{prettify(v){ifThenElse=v}},7);let multipleOf;module.link("./multiple-of/index.js",{prettify(v){multipleOf=v}},8);let pattern;module.link("./pattern/index.js",{prettify(v){pattern=v}},9);let required;module.link("./required/index.js",{prettify(v){required=v}},10);let stringSize;module.link("./string-size/index.js",{prettify(v){stringSize=v}},11);let type;module.link("./type/index.js",{prettify(v){type=v}},12);let unique;module.link("./unique/index.js",{prettify(v){unique=v}},13);













const allHandlers = {
    unknownError,
    additionalProperties,
    anyOf,
    not: anyOf,
    maxItems: arraySize,
    minItems: arraySize,
    maximum: comparison,
    exclusiveMaximum: comparison,
    minimum: comparison,
    exclusiveMinimum: comparison,
    const: _enum,
    enum: _enum,
    format,
    if: ifThenElse,
    multipleOf,
    pattern,
    required,
    maxLength: stringSize,
    minLength: stringSize,
    type,
    uniqueItems: unique,
};
const handlers = allHandlers;
