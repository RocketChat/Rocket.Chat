"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$tail = void 0;
/**
 * @internal
 */
var $tail = function (str) {
    return str[str.length - 1] === "," ? str.substring(0, str.length - 1) : str;
};
exports.$tail = $tail;
//# sourceMappingURL=$tail.js.map