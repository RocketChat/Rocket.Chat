module.export({CoreValidator:()=>CoreValidator,BaseValidator:()=>BaseValidator,BooleanValidator:()=>BooleanValidator,NumberValidator:()=>NumberValidator,StringValidator:()=>StringValidator,NullValidator:()=>NullValidator,AnyValidator:()=>AnyValidator,ObjectValidator:()=>ObjectValidator,ArrayValidator:()=>ArrayValidator,TupleValidator:()=>TupleValidator,AnyOfValidator:()=>AnyOfValidator,AllOfValidator:()=>AllOfValidator,IfValidator:()=>IfValidator,RawValidator:()=>RawValidator,RecursiveValidator:()=>RecursiveValidator,retype:()=>retype,suretype:()=>suretype,annotate:()=>annotate,ensureNamed:()=>ensureNamed});module.export({v:()=>v,recursiveCast:()=>recursiveCast,recursiveUnCast:()=>recursiveUnCast,raw:()=>raw},true);let CoreValidator;module.link("../validators/core/validator.js",{CoreValidator(v){CoreValidator=v}},0);let BaseValidator;module.link("../validators/base/validator.js",{BaseValidator(v){BaseValidator=v}},1);let BooleanValidator;module.link("../validators/boolean/validator.js",{BooleanValidator(v){BooleanValidator=v}},2);let NumberValidator;module.link("../validators/number/validator.js",{NumberValidator(v){NumberValidator=v}},3);let StringValidator;module.link("../validators/string/validator.js",{StringValidator(v){StringValidator=v}},4);let NullValidator;module.link("../validators/null/validator.js",{NullValidator(v){NullValidator=v}},5);let AnyValidator;module.link("../validators/any/validator.js",{AnyValidator(v){AnyValidator=v}},6);let ObjectValidator;module.link("../validators/object/validator.js",{ObjectValidator(v){ObjectValidator=v}},7);let ArrayValidator;module.link("../validators/array/validator.js",{ArrayValidator(v){ArrayValidator=v}},8);let TupleValidator;module.link("../validators/tuple/validator.js",{TupleValidator(v){TupleValidator=v}},9);let AnyOfValidator;module.link("../validators/or/validator.js",{AnyOfValidator(v){AnyOfValidator=v}},10);let AllOfValidator;module.link("../validators/all-of/validator.js",{AllOfValidator(v){AllOfValidator=v}},11);let IfValidator;module.link("../validators/if/validator.js",{IfValidator(v){IfValidator=v}},12);let RawValidator;module.link("../validators/raw/validator.js",{RawValidator(v){RawValidator=v}},13);let RecursiveValidator;module.link("../validators/recursive/validator.js",{RecursiveValidator(v){RecursiveValidator=v}},14);let cloneValidator;module.link("../validation.js",{cloneValidator(v){cloneValidator=v}},15);let AnnotationsHolder,annotateValidator,getAnnotations;module.link("../annotations.js",{AnnotationsHolder(v){AnnotationsHolder=v},annotateValidator(v){annotateValidator=v},getAnnotations(v){getAnnotations=v}},16);

















const string = () => new StringValidator();
const number = () => new NumberValidator();
const object = (obj) => new ObjectValidator(obj);
const tuple = (types) => new TupleValidator(types);
const array = (itemType) => new ArrayValidator(itemType !== null && itemType !== void 0 ? itemType : any());
const arrayOrTuple = ((itemType) => typeof itemType === 'object' && itemType && Array.isArray(itemType)
    ? tuple(itemType)
    : array(itemType));
const boolean = () => new BooleanValidator();
const _null = () => new NullValidator();
const anyOf = (validators) => new AnyOfValidator(validators);
const allOf = (validators) => new AllOfValidator(validators);
const any = () => new AnyValidator();
const unknown = () => new AnyValidator();
const _if = (validator) => new IfValidator(validator);
const recursive = () => new RecursiveValidator();
const v = {
    string,
    number,
    object,
    array: arrayOrTuple,
    boolean,
    null: _null,
    anyOf,
    allOf,
    if: _if,
    any,
    unknown,
    recursive,
};
/**
 * Cast a recursive value (a value in a recursive type)
 */
const recursiveCast = (value) => value;
/**
 * Cast a value into a recursive value (inversion of recursiveCast)
 */
const recursiveUnCast = (value) => value;
const raw = (jsonSchema, fragment) => new RawValidator(jsonSchema, fragment);
function retype(validator) {
    return {
        as() {
            return validator;
        }
    };
}
/**
 * Annotate a validator with a name and other decorations
 *
 * @param annotations Annotations
 * @param validator Target validator to annotate
 * @returns Annotated validator
 */
function suretype(annotations, validator) {
    return annotateValidator(cloneValidator(validator, false), new AnnotationsHolder(annotations));
}
function annotate(annotations, validator) {
    return annotateValidator(cloneValidator(validator, false), new AnnotationsHolder(annotations));
}
/**
 * Ensures a validator is annotated with a name. This will not overwrite the
 * name of a validator, only ensure it has one.
 *
 * @param name The name to annotate with, unless already annotated
 * @param validator The target validator
 * @returns Annotated validator
 */
function ensureNamed(name, validator) {
    const annotations = getAnnotations(validator);
    if (annotations === null || annotations === void 0 ? void 0 : annotations.name)
        return validator;
    return annotateValidator(cloneValidator(validator, false), new AnnotationsHolder({ ...annotations, name }));
}
