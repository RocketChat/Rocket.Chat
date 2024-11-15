"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.example = example;
/**
 * Decorator to describe api examples
 */
function example(options) {
    return (target, propertyKey, descriptor) => {
        target.examples = target.examples || {};
        target.examples[propertyKey] = options;
    };
}
//# sourceMappingURL=IApiExample.js.map