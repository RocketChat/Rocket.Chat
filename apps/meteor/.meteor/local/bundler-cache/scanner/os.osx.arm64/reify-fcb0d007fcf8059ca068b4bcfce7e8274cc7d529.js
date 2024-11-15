module.export({NumberValidator:()=>NumberValidator});let ValueValidator;module.link("../value/validator.js",{ValueValidator(v){ValueValidator=v}},0);let objectOf;module.link("../../utils.js",{objectOf(v){objectOf=v}},1);let DuplicateError,DuplicateConstraintError;module.link("../../errors.js",{DuplicateError(v){DuplicateError=v},DuplicateConstraintError(v){DuplicateConstraintError=v}},2);


class NumberValidator extends ValueValidator {
    constructor() {
        super(...arguments);
        this.type = "number";
        this._multipleOf = undefined;
        this._gt = undefined;
        this._gte = undefined;
        this._lt = undefined;
        this._lte = undefined;
    }
    chainedGt() {
        var _a, _b;
        return (_a = this._gt) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedGt();
    }
    chainedGte() {
        var _a, _b;
        return (_a = this._gte) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedGte();
    }
    chainedLt() {
        var _a, _b;
        return (_a = this._lt) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedLt();
    }
    chainedLte() {
        var _a, _b;
        return (_a = this._lte) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedLte();
    }
    chainedMultipleOf() {
        var _a, _b;
        return (_a = this._multipleOf) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedMultipleOf();
    }
    const(value) {
        return super.const(value);
    }
    enum(...values) {
        return super.enum(...values);
    }
    gt(n) {
        const prev = this.chainedGt();
        const prevPair = this.chainedGte();
        if (prevPair !== undefined)
            throw new DuplicateError("Cannot set gt when gte is set.");
        if (prev !== undefined)
            throw new DuplicateConstraintError("gt");
        const clone = this.clone();
        clone._gt = n;
        return clone;
    }
    gte(n) {
        const prev = this.chainedGte();
        const prevPair = this.chainedGt();
        if (prevPair !== undefined)
            throw new DuplicateError("Cannot set gte when gt is set.");
        if (prev !== undefined)
            throw new DuplicateConstraintError("gte");
        const clone = this.clone();
        clone._gte = n;
        return clone;
    }
    lt(n) {
        const prev = this.chainedLt();
        const prevPair = this.chainedLte();
        if (prevPair !== undefined)
            throw new DuplicateError("Cannot set lt when lte is set.");
        if (prev !== undefined)
            throw new DuplicateConstraintError("lt");
        const clone = this.clone();
        clone._lt = n;
        return clone;
    }
    lte(n) {
        const prev = this.chainedLte();
        const prevPair = this.chainedLt();
        if (prevPair !== undefined)
            throw new DuplicateError("Cannot set lte when lt is set.");
        if (prev !== undefined)
            throw new DuplicateConstraintError("lte");
        const clone = this.clone();
        clone._lte = n;
        return clone;
    }
    integer() {
        const clone = this.clone();
        clone.type = "integer";
        return clone;
    }
    multipleOf(mul) {
        if (this.chainedMultipleOf() !== undefined)
            throw new DuplicateConstraintError("multipleOf");
        const clone = this.clone();
        clone._multipleOf = mul;
        return clone;
    }
    toSchema(traverser) {
        return {
            type: this.type,
            ...this.getJsonSchemaObject(traverser),
            ...objectOf(this.chainedMultipleOf(), "multipleOf"),
            ...objectOf(this.chainedGt(), "exclusiveMinimum"),
            ...objectOf(this.chainedGte(), "minimum"),
            ...objectOf(this.chainedLt(), "exclusiveMaximum"),
            ...objectOf(this.chainedLte(), "maximum"),
        };
    }
    clone(clean = false) {
        const clone = new NumberValidator();
        if (!clean)
            clone.type = this.type;
        return this.setupClone(clean, clone);
    }
}
