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
exports.snake = exports.pascal = exports.camel = void 0;
var NamingConvention_1 = require("../../utils/NamingConvention");
var _convention_1 = require("../$convention");
var _throws_1 = require("../$throws");
var is_1 = require("../is");
var camel = function (method) { return (__assign(__assign({}, base(method)), { any: (0, _convention_1.$convention)(NamingConvention_1.NamingConvention.camel) })); };
exports.camel = camel;
var pascal = function (method) { return (__assign(__assign({}, base(method)), { any: (0, _convention_1.$convention)(NamingConvention_1.NamingConvention.pascal) })); };
exports.pascal = pascal;
var snake = function (method) { return (__assign(__assign({}, base(method)), { any: (0, _convention_1.$convention)(NamingConvention_1.NamingConvention.snake) })); };
exports.snake = snake;
var base = function (method) { return (__assign(__assign({}, (0, is_1.is)()), { throws: (0, _throws_1.$throws)("notations.".concat(method)) })); };
//# sourceMappingURL=notations.js.map