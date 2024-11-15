module.export({compileSchema:()=>compileSchema,validateSchema:()=>validateSchema,compile:()=>compile,validate:()=>validate,isValid:()=>isValid,ensure:()=>ensure,setSchemaDraft07:()=>setSchemaDraft07,validateJsonSchema:()=>validateJsonSchema});let Ajv;module.link("ajv",{default(v){Ajv=v}},0);let ValidationError,makeExplanationGetter;module.link("./validation-error.js",{ValidationError(v){ValidationError=v},makeExplanationGetter(v){makeExplanationGetter=v}},1);let extractSingleJsonSchema;module.link("./extract-json-schema.js",{extractSingleJsonSchema(v){extractSingleJsonSchema=v}},2);let attachSchemaToValidator;module.link("./validation.js",{attachSchemaToValidator(v){attachSchemaToValidator=v}},3);let getRaw;module.link("./validators/raw/validator.js",{getRaw(v){getRaw=v}},4);




function validateWrapper(value, validator, opts) {
    const ok = validator(value);
    if (ok)
        return { ok: true };
    const ret = {
        ok: false,
        errors: [...validator.errors],
    };
    return makeExplanationGetter(ret, 'explanation', ret.errors, {
        schema: validator.schema,
        data: value,
        colors: opts === null || opts === void 0 ? void 0 : opts.colors,
        noFallback: true,
    });
}
// Compile JSON Schemas and validate data
function compileSchema(schema, opts = {}) {
    const { ajvOptions = {} } = opts;
    const ajv = new Ajv(ajvOptions);
    const validator = ajv.compile(schema);
    return function validate(value) {
        return validateWrapper(value, validator, opts);
    };
}
function validateSchema(schema, value) {
    const validator = compileSchema(schema);
    return validator(value);
}
function compile(schema, opts = {}) {
    const { ajvOptions = {}, colors } = opts;
    const validator = innerCompile(ajvOptions, schema);
    function validate(value) {
        const res = validateWrapper(value, validator, opts);
        if (!opts.ensure && !opts.simple)
            return res;
        else if (opts.simple)
            return res.ok;
        else if (res.ok)
            return value;
        else
            throw new ValidationError(res.errors, { schema, data: value, colors });
    }
    return attachSchemaToValidator(validate, schema);
}
function validate(schema, value, options) {
    const validator = compile(schema, options);
    return validator(value);
}
function isValid(schema, value, options) {
    const validator = compile(schema, { ...options, simple: true });
    return validator(value);
}
function ensure(schema, value, options) {
    const validator = compile(schema, { ...options, ensure: true });
    return validator(value);
}
function innerCompile(options, validator) {
    const ajv = new Ajv(options);
    const raw = getRaw(validator);
    if (raw && raw.fragment) {
        const { fragment } = raw;
        ajv.addSchema(raw.toSchema());
        const validatorFn = ajv.getSchema(`#/definitions/${fragment}`);
        if (!validatorFn)
            throw new ReferenceError(`No such fragment "${fragment}"`);
        return validatorFn;
    }
    else {
        return ajv.compile(extractSingleJsonSchema(validator).schema);
    }
}
// Compile and validate JSON Schemas themselves
let _schemaDraft07 = undefined;
function setSchemaDraft07(draft) {
    _schemaDraft07 = draft;
}
let _jsonSchemaValidator;
function getJsonSchemaValidator() {
    if (!_jsonSchemaValidator)
        _jsonSchemaValidator = compileSchema(_schemaDraft07);
    return _jsonSchemaValidator;
}
function validateJsonSchema(schema) {
    const validator = getJsonSchemaValidator();
    return validator(schema);
}
