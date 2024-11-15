"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.string = exports.number = exports.bigint = exports.boolean = void 0;
var boolean = function (value) {
    return value !== "null"
        ? value === "true" || value === "1"
            ? true
            : value === "false" || value === "0"
                ? false
                : value
        : null;
};
exports.boolean = boolean;
var bigint = function (value) {
    return value !== "null" ? toBigint(value) : null;
};
exports.bigint = bigint;
var number = function (value) {
    return value !== "null" ? toNumber(value) : null;
};
exports.number = number;
var string = function (value) { return (value !== "null" ? value : null); };
exports.string = string;
var toNumber = function (str) {
    var value = Number(str);
    return isNaN(value) ? str : value;
};
var toBigint = function (str) {
    try {
        return BigInt(str);
    }
    catch (_a) {
        return str;
    }
};
//# sourceMappingURL=$ParameterReader.js.map