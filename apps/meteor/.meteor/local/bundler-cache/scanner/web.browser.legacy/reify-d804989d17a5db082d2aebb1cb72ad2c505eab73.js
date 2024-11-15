"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.string = exports.number = exports.bigint = exports.boolean = void 0;
var boolean = function (value) {
    return value !== undefined
        ? value === "true"
            ? true
            : value === "false"
                ? false
                : value
        : undefined;
};
exports.boolean = boolean;
var bigint = function (value) {
    return value !== undefined ? toBigint(value) : undefined;
};
exports.bigint = bigint;
var number = function (value) {
    return value !== undefined ? toNumber(value) : undefined;
};
exports.number = number;
var string = function (value) { return value; };
exports.string = string;
var toBigint = function (str) {
    try {
        return BigInt(str);
    }
    catch (_a) {
        return str;
    }
};
var toNumber = function (str) {
    var value = Number(str);
    return isNaN(value) ? str : value;
};
//# sourceMappingURL=$HeadersReader.js.map