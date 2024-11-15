module.export({ObjectValidator:()=>ObjectValidator});let validatorType;module.link("../../validation.js",{validatorType(v){validatorType=v}},0);let ValueValidator;module.link("../value/validator.js",{ValueValidator(v){ValueValidator=v}},1);let isRequired;module.link("../required/validator.js",{isRequired(v){isRequired=v}},2);let AnyValidator;module.link("../any/validator.js",{AnyValidator(v){AnyValidator=v}},3);



class ObjectValidator extends ValueValidator {
    constructor(properties) {
        super();
        this.type = "object";
        this._additional = undefined;
        this._properties = properties;
    }
    chainedAdditional() {
        var _a, _b, _c;
        return (_c = (_a = this._additional) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedAdditional()) !== null && _c !== void 0 ? _c : new AnyValidator();
    }
    const(value) {
        return super.const(value);
    }
    enum(...values) {
        return super.enum(...values);
    }
    additional(type) {
        const clone = this.clone();
        clone._additional =
            type === true
                ? true
                : type === false
                    ? false
                    : type;
        return clone;
    }
    toSchema(traverser) {
        const keys = Object.keys(this._properties);
        const properties = {};
        const required = [];
        keys.forEach(key => {
            properties[key] = traverser.visit(this._properties[key]);
            if (isRequired(this._properties[key]))
                required.push(key);
        });
        const additional = this.chainedAdditional();
        return {
            type: "object",
            ...this.getJsonSchemaObject(traverser),
            ...(keys.length > 0
                ? { properties }
                : {}),
            ...(required.length === 0 ? {} : { required }),
            ...(additional === true
                ? { additionalProperties: true }
                : additional === false
                    ? { additionalProperties: false }
                    : validatorType(additional) === "any"
                        ? {}
                        : { additionalProperties: traverser.visit(additional) }),
        };
    }
    clone(clean = false) {
        return this.setupClone(clean, new ObjectValidator(this._properties));
    }
}
