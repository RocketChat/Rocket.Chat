"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pick = pick;
function pick(object, ...attributes) {
    return {
        ...attributes.reduce((data, key) => ({
            ...data,
            ...(key in object ? { [key]: object[key] } : {}),
        }), {}),
    };
}
//# sourceMappingURL=pick.js.map