module.export({NullValidator:()=>NullValidator});let ValueValidator;module.link("../value/validator.js",{ValueValidator(v){ValueValidator=v}},0);
class NullValidator extends ValueValidator {
    constructor() {
        super(...arguments);
        this.type = "null";
    }
    const(value) {
        return super.const(value);
    }
    enum(...values) {
        return super.enum(...values);
    }
    toSchema(traverser) {
        return {
            type: "null",
            ...this.getJsonSchemaObject(traverser),
        };
    }
    clone(clean = false) {
        return this.setupClone(clean, new NullValidator());
    }
}
