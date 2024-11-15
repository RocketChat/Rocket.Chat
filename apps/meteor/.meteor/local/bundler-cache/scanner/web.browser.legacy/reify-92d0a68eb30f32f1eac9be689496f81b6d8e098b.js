"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify = void 0;
var _number_1 = require("../$number");
var _rest_1 = require("../$rest");
var _string_1 = require("../$string");
var _tail_1 = require("../$tail");
var _throws_1 = require("../$throws");
var is_1 = require("../is");
var stringify = function (method) { return (__assign(__assign({}, (0, is_1.is)()), { number: _number_1.$number, string: _string_1.$string, tail: _tail_1.$tail, rest: _rest_1.$rest, throws: (0, _throws_1.$throws)("json.".concat(method)) })); };
exports.stringify = stringify;
//# sourceMappingURL=json.js.map