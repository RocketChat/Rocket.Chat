"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$guard = void 0;
var TypeGuardError_1 = require("../TypeGuardError");
/**
 * @internal
 */
var $guard = function (method) {
    return function (exceptionable, props, factory) {
        if (exceptionable === true)
            throw (factory !== null && factory !== void 0 ? factory : (function (props) { return new TypeGuardError_1.TypeGuardError(props); }))({
                method: method,
                path: props.path,
                expected: props.expected,
                value: props.value,
            });
        return false;
    };
};
exports.$guard = $guard;
//# sourceMappingURL=$guard.js.map