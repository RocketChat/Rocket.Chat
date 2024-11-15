module.export({validatorToSchema:()=>validatorToSchema,validatorType:()=>validatorType,cloneValidator:()=>cloneValidator,attachSchemaToValidator:()=>attachSchemaToValidator,getValidatorSchema:()=>getValidatorSchema,uniqValidators:()=>uniqValidators});let CoreValidator,exposeCoreValidator;module.link("./validators/core/validator.js",{CoreValidator(v){CoreValidator=v},exposeCoreValidator(v){exposeCoreValidator=v}},0);let getRaw;module.link("./validators/raw/validator.js",{getRaw(v){getRaw=v}},1);

function validatorToSchema(validator, traverser) {
    return exposeCoreValidator(validator).toSchema(traverser);
}
function validatorType(validator) {
    return exposeCoreValidator(validator).type;
}
function cloneValidator(validator, clean) {
    return exposeCoreValidator(validator).clone(clean);
}
const schemaLookup = new WeakMap();
function attachSchemaToValidator(validator, schema) {
    schemaLookup.set(validator, schema);
    return validator;
}
function getValidatorSchema(val) {
    if (val && val instanceof CoreValidator)
        return val;
    // Maybe validator function
    if (val && val instanceof Function)
        return schemaLookup.get(val);
    return undefined;
}
function uniqValidators(validators) {
    validators = [...new Set(validators)];
    return [
        ...new Map(validators.map(validator => {
            const raw = getRaw(validator);
            return raw
                ? [raw.toSchema(), raw]
                : [{}, validator];
        }))
            .values()
    ];
}
