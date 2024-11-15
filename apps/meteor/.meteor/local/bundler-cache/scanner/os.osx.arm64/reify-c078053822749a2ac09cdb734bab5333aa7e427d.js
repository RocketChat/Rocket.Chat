module.export({StringValidator:()=>StringValidator});let ValueValidator;module.link("../value/validator.js",{ValueValidator(v){ValueValidator=v}},0);let objectOf;module.link("../../utils.js",{objectOf(v){objectOf=v}},1);let DuplicateConstraintError;module.link("../../errors.js",{DuplicateConstraintError(v){DuplicateConstraintError=v}},2);


class StringValidator extends ValueValidator {
    constructor() {
        super(...arguments);
        this.type = "string";
        this._min = undefined;
        this._max = undefined;
        this._pattern = undefined;
        this._format = undefined;
    }
    chainedMinLength() {
        var _a, _b;
        return (_a = this._min) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedMinLength();
    }
    chainedMaxLength() {
        var _a, _b;
        return (_a = this._max) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedMaxLength();
    }
    chainedPattern() {
        var _a, _b;
        return (_a = this._pattern) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedPattern();
    }
    chainedFormat() {
        var _a, _b;
        return (_a = this._format) !== null && _a !== void 0 ? _a : (_b = this._parent) === null || _b === void 0 ? void 0 : _b.chainedFormat();
    }
    const(value) {
        return super.const(value);
    }
    enum(...values) {
        return super.enum(...values);
    }
    minLength(n) {
        if (this.chainedMinLength() !== undefined)
            throw new DuplicateConstraintError("minLength");
        const clone = this.clone();
        clone._min = n;
        return clone;
    }
    maxLength(n) {
        if (this.chainedMaxLength() !== undefined)
            throw new DuplicateConstraintError("maxLength");
        const clone = this.clone();
        clone._max = n;
        return clone;
    }
    matches(regex) {
        if (this.chainedPattern() !== undefined)
            throw new DuplicateConstraintError("matches");
        const clone = this.clone();
        if (typeof regex === "string")
            clone._pattern = regex;
        else
            clone._pattern = regex.source;
        return clone;
    }
    numeric() {
        return this.matches("^(0|-?([1-9][0-9]*)(\.[0-9]+)?)$");
    }
    format(format) {
        if (this.chainedFormat())
            throw new DuplicateConstraintError("format");
        const clone = this.clone();
        clone._format = format;
        return clone;
    }
    toSchema(traverser) {
        return {
            type: "string",
            ...this.getJsonSchemaObject(traverser),
            ...objectOf(this.chainedMinLength(), "minLength"),
            ...objectOf(this.chainedMaxLength(), "maxLength"),
            ...objectOf(this.chainedPattern(), "pattern"),
            ...objectOf(this.chainedFormat(), "format"),
        };
    }
    clone(clean = false) {
        return this.setupClone(clean, new StringValidator());
    }
}
