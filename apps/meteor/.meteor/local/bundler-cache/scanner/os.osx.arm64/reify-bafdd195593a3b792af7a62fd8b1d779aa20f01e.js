module.export({TreeTraverserImpl:()=>TreeTraverserImpl});let validatorToSchema;module.link("./validation.js",{validatorToSchema(v){validatorToSchema=v}},0);let getName;module.link("./annotations.js",{getName(v){getName=v}},1);let getRaw,isRaw;module.link("./validators/raw/validator.js",{getRaw(v){getRaw=v},isRaw(v){isRaw=v}},2);


class TreeTraverserImpl {
    constructor(validators, refMethod, allowUnnamed) {
        this.refMethod = refMethod;
        this.allowUnnamed = allowUnnamed;
        this.initialValidators = new Map();
        this.extraValidators = new Map();
        this.validatorNames = new Set();
        this.definitions = {};
        this.lookupMap = new Map();
        this.duplicates = new Map();
        this.currentSchemaName = undefined;
        const rawValidators = validators
            .filter(isRaw)
            .map(validator => getRaw(validator));
        const regularValidators = validators.filter(validator => !isRaw(validator));
        rawValidators
            .forEach(validator => {
            const schema = validator.toSchema();
            if (typeof schema.definitions === 'object') {
                Object
                    .entries(schema.definitions)
                    .forEach(([fragment, subSchema]) => {
                    const name = this.getNextName(fragment);
                    this.definitions[name] = subSchema;
                });
            }
            else {
                this.lookupMap.set(validator, schema);
                const name = this.getNextName(getName(validator));
                if (name)
                    this.definitions[name] = schema;
                else if (!allowUnnamed)
                    throw new TypeError("Got unnamed validator");
            }
        });
        regularValidators
            .map(validator => this.makeRef(validator, false))
            .forEach(nameAndValidator => { this.insert(nameAndValidator); });
    }
    visit(validator) {
        const name = this.getValidatorName(validator);
        if (!name)
            return validatorToSchema(validator, this);
        return { $ref: `#/definitions/${name}` };
    }
    getSchema() {
        return {
            schema: {
                definitions: this.definitions,
            },
            duplicates: this.duplicates,
            lookup: this.lookupMap,
        };
    }
    getValidatorName(validator) {
        if (this.refMethod === 'no-refs')
            return undefined;
        const name = getName(validator);
        if (!name)
            return undefined;
        const nameIfInitial = this.initialValidators.get(validator);
        if (nameIfInitial)
            return nameIfInitial;
        if (this.refMethod === 'provided')
            return undefined;
        const nameIfExtra = this.extraValidators.get(validator);
        if (nameIfExtra)
            return nameIfExtra;
        // Instanciate new extra validator definition
        return this.insert(this.makeRef(validator, true));
    }
    insert({ name, validator }) {
        if (name)
            this.currentSchemaName = name;
        const schema = validatorToSchema(validator, this);
        this.lookupMap.set(validator, schema);
        if (name)
            this.definitions[name] = schema;
        this.currentSchemaName = undefined;
        return name;
    }
    makeRef(validator, extra) {
        const baseName = getName(validator);
        if (!baseName && !extra && this.allowUnnamed)
            return { validator };
        const name = this.getNextName(baseName);
        if (extra)
            this.extraValidators.set(validator, name);
        else
            this.initialValidators.set(validator, name);
        return { name, validator };
    }
    getNextName(baseName) {
        var _a;
        if (baseName && !this.validatorNames.has(baseName)) {
            this.validatorNames.add(baseName);
            return baseName;
        }
        if (baseName)
            this.duplicates.set(baseName, 1 + ((_a = this.duplicates.get(baseName)) !== null && _a !== void 0 ? _a : 1));
        const iterationName = baseName !== null && baseName !== void 0 ? baseName : 'Unknown';
        let i = baseName ? 1 : 0;
        while (true) {
            const name = iterationName + `_${++i}`;
            if (!this.validatorNames.has(name)) {
                this.validatorNames.add(name);
                return name;
            }
        }
    }
}
