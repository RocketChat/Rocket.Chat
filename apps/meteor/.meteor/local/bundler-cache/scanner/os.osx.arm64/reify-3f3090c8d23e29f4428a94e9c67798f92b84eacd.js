module.export({TupleValidator:()=>TupleValidator});let ValueValidator;module.link("../value/validator.js",{ValueValidator(v){ValueValidator=v}},0);let isRequired;module.link("../required/validator.js",{isRequired(v){isRequired=v}},1);let AnyValidator;module.link("../any/validator.js",{AnyValidator(v){AnyValidator=v}},2);let DuplicateConstraintError;module.link("../../errors.js",{DuplicateConstraintError(v){DuplicateConstraintError=v}},3);



class TupleValidator extends ValueValidator {
    constructor(validators) {
        super();
        this.validators = validators;
        this.type = "array";
        this._unique = undefined;
        this._minItems = undefined;
        this._maxItems = undefined;
        this._contains = undefined;
        this._additional = undefined;
        this._numRequired = TupleValidator.findMinItems(validators);
    }
    const(value) {
        return super.const(value);
    }
    enum(...values) {
        return super.enum(...values);
    }
    static findMinItems(validators) {
        for (let i = validators.length - 1; i >= 0; --i) {
            if (isRequired(validators[i]))
                return i + 1;
        }
        return 0;
    }
    /**
     * ## Minimum number of items
     */
    minItems(min) {
        if (this._minItems !== undefined)
            throw new DuplicateConstraintError("minItems");
        if (min < this._numRequired)
            throw new RangeError("minItems cannot be smaller than {required}");
        if (this._maxItems !== undefined && this._maxItems < min)
            throw new RangeError("minItems cannot be larger than maxItems");
        const clone = this.clone();
        clone._minItems = Math.max(min, this._numRequired);
        return clone;
    }
    /**
     * ## Maximum number of items
     */
    maxItems(max) {
        if (this._maxItems !== undefined)
            throw new DuplicateConstraintError("maxItems");
        if (this._minItems !== undefined && this._minItems > max)
            throw new RangeError("maxItems cannot be smaller than minItems");
        if (this._numRequired > max)
            throw new RangeError("maxItems cannot be smaller than {required}");
        const clone = this.clone();
        clone._maxItems = max;
        return clone;
    }
    additional(type) {
        if (this._additional !== undefined)
            throw new DuplicateConstraintError("additional");
        const clone = this.clone();
        clone._additional =
            type === true
                ? new AnyValidator()
                : type === false
                    ? undefined
                    : type;
        return clone;
    }
    contains(validator) {
        if (this._contains !== undefined)
            throw new DuplicateConstraintError("contains");
        const clone = this.clone();
        clone._contains = validator;
        return clone;
    }
    unique(unique = true) {
        const clone = this.clone();
        clone._unique = unique;
        return clone;
    }
    toSchema(traverser) {
        var _a, _b;
        const items = {
            items: this.validators.length === 0
                ? this._additional === undefined
                    ? false
                    : true
                : this.validators.map(validator => traverser.visit(validator))
        };
        const additionalItems = {
            additionalItems: this._additional === undefined
                ? false
                : this._additional instanceof AnyValidator
                    ? true
                    : traverser.visit(this._additional)
        };
        const contains = this._contains
            ? { contains: traverser.visit(this._contains) }
            : {};
        const minItems = this._minItems || this._numRequired
            ? { minItems: Math.max((_a = this._minItems) !== null && _a !== void 0 ? _a : 0, (_b = this._numRequired) !== null && _b !== void 0 ? _b : 0)
            }
            : {};
        const maxItems = this._maxItems ? { maxItems: this._maxItems } : {};
        return {
            type: "array",
            ...this.getJsonSchemaObject(traverser),
            ...items,
            ...contains,
            ...additionalItems,
            ...minItems,
            ...maxItems,
            ...(this._unique ? { uniqueItems: true } : {}),
        };
    }
    clone(clean = false) {
        const clone = this.setupClone(clean, new TupleValidator(this.validators));
        clone._unique = this._unique;
        clone._numRequired = this._numRequired;
        clone._minItems = this._minItems;
        clone._maxItems = this._maxItems;
        clone._contains = this._contains;
        clone._additional = this._additional;
        return clone;
    }
}
