"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeDuplicate = exports.capitalize = void 0;
var capitalize = function (str) {
    return str.length ? str[0].toUpperCase() + str.slice(1).toLowerCase() : str;
};
exports.capitalize = capitalize;
var escapeDuplicate = function (keep) {
    return function (change) {
        return keep.includes(change) ? (0, exports.escapeDuplicate)(keep)("_".concat(change)) : change;
    };
};
exports.escapeDuplicate = escapeDuplicate;
//# sourceMappingURL=StringUtil.js.map