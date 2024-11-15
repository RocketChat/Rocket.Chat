"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapExceptions = wrapExceptions;
const isPromise = (value) => !!value && value instanceof Promise;
function wrapExceptions(getter) {
    const doCatch = (errorWrapper) => {
        try {
            const value = getter();
            if (isPromise(value)) {
                return value.catch(errorWrapper);
            }
            return value;
        }
        catch (error) {
            return errorWrapper(error);
        }
    };
    const doSuppress = (errorWrapper) => {
        try {
            const value = getter();
            if (isPromise(value)) {
                return value.catch((error) => errorWrapper?.(error));
            }
            return value;
        }
        catch (error) {
            errorWrapper?.(error);
        }
    };
    return {
        catch: doCatch,
        suppress: doSuppress,
    };
}
//# sourceMappingURL=wrapExceptions.js.map