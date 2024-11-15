module.export({RecursiveValidator:()=>RecursiveValidator});let BaseValidator;module.link("../base/validator.js",{BaseValidator(v){BaseValidator=v}},0);let RequiredValidator;module.link("../required/validator.js",{RequiredValidator(v){RequiredValidator=v}},1);

class RecursiveValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this.type = 'recursive';
    }
    required() {
        return new RequiredValidator(this);
    }
    toSchema(traverser) {
        return {
            $ref: `#/definitions/${traverser.currentSchemaName}`,
            ...this.getJsonSchemaObject(traverser),
        };
    }
    clone(clean = false) {
        return super.setupClone(clean, new RecursiveValidator());
    }
}
