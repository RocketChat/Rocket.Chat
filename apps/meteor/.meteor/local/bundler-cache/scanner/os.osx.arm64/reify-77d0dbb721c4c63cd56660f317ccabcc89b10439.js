module.export({ValueValidator:()=>ValueValidator});let BaseValidator;module.link("../base/validator.js",{BaseValidator(v){BaseValidator=v}},0);let DuplicateConstraintError,DuplicateError;module.link("../../errors.js",{DuplicateConstraintError(v){DuplicateConstraintError=v},DuplicateError(v){DuplicateError=v}},1);let RequiredValidator;module.link("../required/validator.js",{RequiredValidator(v){RequiredValidator=v}},2);


class ValueValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this._default = undefined;
        this._constValue = undefined;
        this._enumValues = undefined;
        this._anyOf = undefined;
        this._allOf = undefined;
    }
    /**
     * ## One fixed value
     *
     * `const` is identical to an `enum` with only one entry, and is used to
     * force an exact value of a type.
     */
    const(value) {
        if (this._constValue)
            throw new DuplicateConstraintError("const");
        if (this._enumValues)
            throw new DuplicateError("Cannot use both const and enum");
        const clone = this.clone();
        clone._constValue = value;
        return clone;
    }
    /**
     * ## Enumerate values
     *
     * `enum` can be used to specify the exact set of values allowed, and is
     * specified as individual arguments.
     *
     * By default, no enum is specified, meaning any value matching the *type*
     * is allowed.
     */
    enum(...values) {
        if (this._enumValues)
            throw new DuplicateConstraintError("enum");
        if (this._constValue)
            throw new DuplicateError("Cannot use both const and enum");
        const clone = this.clone();
        clone._enumValues = [...new Set(values)];
        return clone;
    }
    default(value) {
        if (this._default)
            throw new DuplicateConstraintError("default");
        const clone = this.clone();
        clone._default = value;
        return clone;
    }
    required() {
        return new RequiredValidator(this);
    }
    getConst() {
        var _a, _b;
        return (_a = this._constValue) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.getConst();
    }
    getConstSchema() {
        const const_ = this.getConst();
        if (!const_)
            return {};
        return { const: const_ };
    }
    getEnum() {
        var _a, _b;
        return (_a = this._enumValues) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.getEnum();
    }
    getEnumSchema() {
        const enum_ = this.getEnum();
        if (!enum_)
            return {};
        return enum_.length === 0 ? {} : { enum: enum_ };
    }
    anyOf(condition) {
        if (this._anyOf)
            throw new DuplicateConstraintError("anyOf");
        const clone = this.clone();
        clone._anyOf = typeof condition === "function"
            ? condition(this.clone(true))
            : condition;
        if (clone._anyOf.length === 0)
            throw new RangeError("anyOf must have at least 1 item");
        return clone;
    }
    getAnyOf() {
        var _a, _b;
        return (_a = this._anyOf) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.getAnyOf();
    }
    getAnyOfSchemaObject(traverser) {
        const anyOf = this.getAnyOf();
        if (!anyOf)
            return {};
        return {
            anyOf: anyOf.map(validator => cleanFromTypeProperty(traverser.visit(validator)))
        };
    }
    allOf(condition) {
        if (this._allOf)
            throw new DuplicateConstraintError("allOf");
        const clone = this.clone();
        clone._allOf = typeof condition === "function"
            ? condition(this.clone(true))
            : condition;
        if (clone._allOf.length === 0)
            throw new RangeError("allOf must have at least 1 item");
        return clone;
    }
    getAllOf() {
        var _a, _b;
        return (_a = this._allOf) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.getAllOf();
    }
    getAllOfSchemaObject(traverser) {
        const allOf = this.getAllOf();
        if (!allOf)
            return {};
        return {
            allOf: allOf.map(validator => cleanFromTypeProperty(traverser.visit(validator)))
        };
    }
    getDefault() {
        var _a, _b;
        return (_a = this._default) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.getDefault();
    }
    getDefaultSchema() {
        const default_ = this.getDefault();
        if (default_ === undefined)
            return {};
        return { default: default_ };
    }
    getJsonSchemaObject(traverser) {
        return {
            ...super.getJsonSchemaObject(traverser),
            ...this.getConstSchema(),
            ...this.getEnumSchema(),
            ...this.getDefaultSchema(),
            ...this.getAnyOfSchemaObject(traverser),
            ...this.getAllOfSchemaObject(traverser),
        };
    }
    setupClone(clean, clone) {
        const ret = clone;
        if (!clean) {
            ret._enumValues = this._enumValues;
            ret._anyOf = this._anyOf;
            ret._allOf = this._allOf;
        }
        return super.setupClone(clean, clone);
    }
}
function cleanFromTypeProperty(t) {
    const { type, ...ret } = t;
    return ret;
}
