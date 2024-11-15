module.export({ArrayValidator:()=>ArrayValidator});let ValueValidator;module.link("../value/validator.js",{ValueValidator(v){ValueValidator=v}},0);let DuplicateConstraintError;module.link("../../errors.js",{DuplicateConstraintError(v){DuplicateConstraintError=v}},1);

// NOTE:
// "Additional items" are not implemented for array, only tuple-types.
class ArrayValidator extends ValueValidator {
    constructor(validator) {
        super();
        this.validator = validator;
        this.type = "array";
        this._unique = undefined;
        this._minItems = undefined;
        this._maxItems = undefined;
        this._contains = undefined;
    }
    const(value) {
        return super.const(value);
    }
    enum(...values) {
        return super.enum(...values);
    }
    /**
     * ## Minimum number of items
     */
    minItems(min) {
        if (this._minItems !== undefined)
            throw new DuplicateConstraintError("minItems");
        if (this._maxItems !== undefined && this._maxItems < min)
            throw new RangeError("minItems cannot be larger than maxItems");
        const clone = this.clone();
        clone._minItems = min;
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
        const clone = this.clone();
        clone._maxItems = max;
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
        const contains = this._contains
            ? { contains: traverser.visit(this._contains) }
            : {};
        const minItems = this._minItems ? { minItems: this._minItems } : {};
        const maxItems = this._maxItems ? { maxItems: this._maxItems } : {};
        return {
            type: "array",
            ...this.getJsonSchemaObject(traverser),
            items: traverser.visit(this.validator),
            ...contains,
            ...minItems,
            ...maxItems,
            ...(this._unique ? { uniqueItems: true } : {}),
        };
    }
    clone(clean = false) {
        const clone = this.setupClone(clean, new ArrayValidator(this.validator));
        clone._unique = this._unique;
        clone._minItems = this._minItems;
        clone._maxItems = this._maxItems;
        clone._contains = this._contains;
        return clone;
    }
}
