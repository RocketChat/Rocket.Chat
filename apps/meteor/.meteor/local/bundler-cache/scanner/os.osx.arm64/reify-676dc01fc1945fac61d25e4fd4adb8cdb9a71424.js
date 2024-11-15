module.export({ElseValidator:()=>ElseValidator,ThenValidator:()=>ThenValidator,IfValidator:()=>IfValidator});let BaseValidator;module.link("../base/validator.js",{BaseValidator(v){BaseValidator=v}},0);let RequiredValidator;module.link("../required/validator.js",{RequiredValidator(v){RequiredValidator=v}},1);

class ElseValidator extends BaseValidator {
    constructor() {
        super();
        this.type = "if";
        this._if = undefined;
        this._then = undefined;
        this._else = undefined;
    }
    required() {
        return new RequiredValidator(this);
    }
    toSchema(traverser) {
        return {
            ...super.getJsonSchemaObject(traverser),
            if: traverser.visit(this._if),
            ...(this._then ? { then: traverser.visit(this._then) } : {}),
            ...(this._else ? { else: traverser.visit(this._else) } : {}),
        };
    }
    clone(clean = false) {
        const child = new ElseValidator();
        if (!clean) {
            child._if = this._if;
            child._then = this._then;
            child._else = this._else;
        }
        return this.setupClone(clean, child);
    }
}
class ThenValidator extends ElseValidator {
    constructor() {
        super();
        this.type = "if";
    }
    else(validator) {
        const then = new ElseValidator();
        then._if = this._if;
        then._then = this._then;
        then._else = validator;
        return then;
    }
    clone(clean = false) {
        const child = new ThenValidator();
        if (!clean) {
            child._if = this._if;
            child._then = this._then;
            child._else = this._else;
        }
        return this.setupClone(clean, child);
    }
}
class IfValidator extends ThenValidator {
    constructor(validator) {
        super();
        this.type = "if";
        this._if = validator;
    }
    then(validator) {
        const then = new ThenValidator();
        then._if = this._if;
        then._then = validator;
        return then;
    }
    clone(clean = false) {
        return this.setupClone(clean, new IfValidator(this._if));
    }
}
