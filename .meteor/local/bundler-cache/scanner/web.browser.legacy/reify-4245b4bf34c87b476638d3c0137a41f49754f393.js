"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = void 0;
var toString = function (object) { return (object ? "" + object : ''); };
var escapeRegExp = function (input) {
    return toString(input).replace(/[-.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
};
exports.escapeRegExp = escapeRegExp;
//# sourceMappingURL=escapeRegExp.js.map