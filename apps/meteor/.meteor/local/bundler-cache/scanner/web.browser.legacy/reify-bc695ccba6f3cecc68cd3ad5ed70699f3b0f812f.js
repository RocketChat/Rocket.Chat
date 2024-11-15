"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.file = exports.blob = exports.array = exports.string = exports.bigint = exports.number = exports.boolean = void 0;
var boolean = function (input) {
    return input instanceof File
        ? input
        : input === null
            ? undefined
            : input === "null"
                ? null
                : input.length === 0
                    ? true
                    : input === "true" || input === "1"
                        ? true
                        : input === "false" || input === "0"
                            ? false
                            : input;
}; // wrong type
exports.boolean = boolean;
var number = function (input) {
    return input instanceof File
        ? input
        : !!(input === null || input === void 0 ? void 0 : input.length)
            ? input === "null"
                ? null
                : toNumber(input)
            : undefined;
};
exports.number = number;
var bigint = function (input) {
    return input instanceof File
        ? input
        : !!(input === null || input === void 0 ? void 0 : input.length)
            ? input === "null"
                ? null
                : toBigint(input)
            : undefined;
};
exports.bigint = bigint;
var string = function (input) {
    return input instanceof File
        ? input
        : input === null
            ? undefined
            : input === "null"
                ? null
                : input;
};
exports.string = string;
var array = function (input, alternative) {
    return input.length ? input : alternative;
};
exports.array = array;
var blob = function (input) {
    return input instanceof Blob
        ? input
        : input === null
            ? undefined
            : input === "null"
                ? null
                : input;
};
exports.blob = blob;
var file = function (input) {
    return input instanceof File
        ? input
        : input === null
            ? undefined
            : input === "null"
                ? null
                : input;
};
exports.file = file;
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
//# sourceMappingURL=$FormDataReader.js.map