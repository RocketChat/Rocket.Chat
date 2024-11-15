module.export({BaseValidator:()=>BaseValidator,InternalBaseValidator:()=>InternalBaseValidator,exposeBaseValidator:()=>exposeBaseValidator});let CoreValidator;module.link("../core/validator.js",{CoreValidator(v){CoreValidator=v}},0);
class BaseValidator extends CoreValidator {
    constructor() {
        super(...arguments);
        this._parent = undefined;
    }
    setupClone(clean, clone) {
        const ret = clone;
        if (!clean)
            ret._parent = this;
        return ret;
    }
}
class InternalBaseValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        // CoreValidator
        this._annotations = undefined;
        // BaseValidator
        this._parent = undefined;
    }
}
function exposeBaseValidator(validator) {
    return validator;
}
