module.export({RequiredValidator:()=>RequiredValidator,InternalRequiredValidator:()=>InternalRequiredValidator,isRequired:()=>isRequired,extractRequiredValidator:()=>extractRequiredValidator});let BaseValidator;module.link("../base/validator.js",{BaseValidator(v){BaseValidator=v}},0);let validatorType,cloneValidator;module.link("../../validation.js",{validatorType(v){validatorType=v},cloneValidator(v){cloneValidator=v}},1);

class RequiredValidator extends BaseValidator {
    constructor(validator) {
        super();
        this.validator = validator;
    }
    get type() {
        return validatorType(this.validator);
    }
    toSchema(traverser) {
        return {
            ...super.getJsonSchemaObject(traverser),
            ...traverser.visit(this.validator)
        };
    }
    clone(clean = false) {
        const clonedInner = cloneValidator(this.validator, clean);
        return new RequiredValidator(clonedInner);
    }
}
class InternalRequiredValidator extends RequiredValidator {
}
function isRequired(validator) {
    return validator instanceof RequiredValidator;
}
function extractRequiredValidator(validator) {
    return validator instanceof RequiredValidator
        ? validator.validator
        : validator;
}
