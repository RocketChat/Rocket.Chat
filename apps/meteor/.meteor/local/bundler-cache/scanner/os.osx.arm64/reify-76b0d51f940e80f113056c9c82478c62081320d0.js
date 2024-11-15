module.export({CoreValidator:()=>CoreValidator,InternalCoreValidator:()=>InternalCoreValidator,exposeCoreValidator:()=>exposeCoreValidator});class CoreValidator {
    constructor() {
        this._annotations = undefined;
    }
    getJsonSchemaObject(traverser) {
        if (!this._annotations)
            return {};
        const { title, description, examples } = this._annotations.options;
        return {
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(examples ? { examples } : {}),
        };
    }
}
class InternalCoreValidator extends CoreValidator {
    constructor() {
        super(...arguments);
        this._annotations = undefined;
    }
}
function exposeCoreValidator(validator) {
    return validator;
}
