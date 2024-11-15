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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = exports.validate = exports.assert = exports.is = exports.protobuf = exports.misc = exports.notations = exports.http = exports.json = exports.functional = void 0;
var RandomGenerator_1 = require("../../utils/RandomGenerator");
var _every_1 = require("../$every");
var _guard_1 = require("../$guard");
var _join_1 = require("../$join");
var _report_1 = require("../$report");
var TypeGuardError_1 = require("../../TypeGuardError");
var is_1 = require("../is");
Object.defineProperty(exports, "is", { enumerable: true, get: function () { return is_1.is; } });
exports.functional = __importStar(require("./functional"));
exports.json = __importStar(require("./json"));
exports.http = __importStar(require("./http"));
exports.notations = __importStar(require("./notations"));
exports.misc = __importStar(require("./misc"));
exports.protobuf = __importStar(require("./protobuf"));
var assert = function (method) { return (__assign(__assign({}, (0, is_1.is)()), { join: _join_1.$join, every: _every_1.$every, guard: (0, _guard_1.$guard)("typia.".concat(method)), predicate: function (matched, exceptionable, closure) {
        if (matched === false && exceptionable === true)
            throw new TypeGuardError_1.TypeGuardError(__assign(__assign({}, closure()), { method: "typia.".concat(method) }));
        return matched;
    } })); };
exports.assert = assert;
var validate = function () { return (__assign(__assign({}, (0, is_1.is)()), { join: _join_1.$join, report: _report_1.$report, predicate: function (res) {
        return function (matched, exceptionable, closure) {
            // CHECK FAILURE
            if (matched === false && exceptionable === true)
                (function () {
                    res.success && (res.success = false);
                    var errorList = res.errors;
                    // TRACE ERROR
                    var error = closure();
                    if (errorList.length) {
                        var last = errorList[errorList.length - 1].path;
                        if (last.length >= error.path.length &&
                            last.substring(0, error.path.length) === error.path)
                            return;
                    }
                    errorList.push(error);
                    return;
                })();
            return matched;
        };
    } })); };
exports.validate = validate;
var random = function () { return ({
    generator: RandomGenerator_1.RandomGenerator,
    pick: RandomGenerator_1.RandomGenerator.pick,
}); };
exports.random = random;
//# sourceMappingURL=index.js.map