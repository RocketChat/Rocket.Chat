module.export({AnyValidator:()=>AnyValidator});let BaseValidator;module.link("../base/validator.js",{BaseValidator(v){BaseValidator=v}},0);let RequiredValidator;module.link("../required/validator.js",{RequiredValidator(v){RequiredValidator=v}},1);

class AnyValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this.type = "any";
    }
    required() {
        return new RequiredValidator(this);
    }
    toSchema(traverser) {
        return {
            ...super.getJsonSchemaObject(traverser),
        };
    }
    clone(clean = false) {
        return this.setupClone(clean, new AnyValidator());
    }
}
