module.export({RawValidator:()=>RawValidator,isRaw:()=>isRaw,getRaw:()=>getRaw});let CoreValidator;module.link("../core/validator.js",{CoreValidator(v){CoreValidator=v}},0);let extractRequiredValidator,RequiredValidator;module.link("../required/validator.js",{extractRequiredValidator(v){extractRequiredValidator=v},RequiredValidator(v){RequiredValidator=v}},1);

class RawValidator extends CoreValidator {
    constructor(jsonSchema, fragment) {
        super();
        this.jsonSchema = jsonSchema;
        this.fragment = fragment;
        this.type = 'raw';
    }
    toSchema() {
        return this.jsonSchema;
    }
    required() {
        return new RequiredValidator(this);
    }
    clone(_clean = false) {
        return new RawValidator(JSON.parse(JSON.stringify(this.jsonSchema)));
    }
}
function isRaw(validator) {
    return validator instanceof RawValidator;
}
function getRaw(validator) {
    validator = extractRequiredValidator(validator);
    return isRaw(validator) ? validator : undefined;
}
