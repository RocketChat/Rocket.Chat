"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = exports.params = exports.string = exports.bigint = exports.number = exports.boolean = void 0;
var boolean = function (str) {
    return str === null
        ? undefined
        : str === "null"
            ? null
            : str.length === 0
                ? true
                : str === "true" || str === "1"
                    ? true
                    : str === "false" || str === "0"
                        ? false
                        : str;
}; // wrong type
exports.boolean = boolean;
var number = function (str) {
    return !!(str === null || str === void 0 ? void 0 : str.length) ? (str === "null" ? null : toNumber(str)) : undefined;
};
exports.number = number;
var bigint = function (str) {
    return !!(str === null || str === void 0 ? void 0 : str.length) ? (str === "null" ? null : toBigint(str)) : undefined;
};
exports.bigint = bigint;
var string = function (str) {
    return str === null ? undefined : str === "null" ? null : str;
};
exports.string = string;
var params = function (input) {
    if (typeof input === "string") {
        var index = input.indexOf("?");
        input = index === -1 ? "" : input.substring(index + 1);
        return new URLSearchParams(input);
    }
    return input;
};
exports.params = params;
var array = function (input, alternative) {
    return input.length ? input : alternative;
};
exports.array = array;
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
//# sourceMappingURL=$QueryReader.js.map