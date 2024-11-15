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
exports.prune = exports.clone = void 0;
var _any_1 = require("../$any");
var _throws_1 = require("../$throws");
var is_1 = require("../is");
var clone = function (method) { return (__assign(__assign({}, (0, is_1.is)()), { throws: (0, _throws_1.$throws)("misc.".concat(method)), any: _any_1.$any })); };
exports.clone = clone;
var prune = function (method) { return (__assign(__assign({}, (0, is_1.is)()), { throws: (0, _throws_1.$throws)("misc.".concat(method)) })); };
exports.prune = prune;
//# sourceMappingURL=misc.js.map