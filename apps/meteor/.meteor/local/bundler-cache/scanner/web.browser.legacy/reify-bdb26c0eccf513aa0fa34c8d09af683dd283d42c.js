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
exports.$throws = void 0;
var TypeGuardError_1 = require("../TypeGuardError");
var $throws = function (method) {
    return function (props) {
        throw new TypeGuardError_1.TypeGuardError(__assign(__assign({}, props), { method: "typia.".concat(method) }));
    };
};
exports.$throws = $throws;
//# sourceMappingURL=$throws.js.map