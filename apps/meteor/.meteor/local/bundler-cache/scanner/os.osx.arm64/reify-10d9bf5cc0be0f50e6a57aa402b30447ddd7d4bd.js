module.link("./json-schema-nodejs.js");module.link("./ajv-errors-nodejs.js");module.link("./index-core.js",{"*":"*"},0);let inspect;module.link("node:util",{inspect(v){inspect=v}},1);let setErrorHook,ValidationError;module.link("./validation-error.js",{setErrorHook(v){setErrorHook=v},ValidationError(v){ValidationError=v}},2);


// Patch the ValidationError to make Node.js console printing prettier


ValidationError.prototype[inspect.custom] = function () {
    return this.explanation;
};
const debouncedExplanations = new WeakSet();
setErrorHook((err) => {
    const { message, stack } = err;
    Object.defineProperties(err, {
        message: {
            get() {
                if (debouncedExplanations.has(this))
                    return message;
                debouncedExplanations.add(this);
                setImmediate(() => debouncedExplanations.delete(this));
                return message + "\n" + this.explanation;
            }
        },
        stack: {
            get() {
                if (debouncedExplanations.has(this))
                    return stack;
                debouncedExplanations.add(this);
                setImmediate(() => debouncedExplanations.delete(this));
                return this.explanation + "\n" + stack;
            }
        },
    });
});
