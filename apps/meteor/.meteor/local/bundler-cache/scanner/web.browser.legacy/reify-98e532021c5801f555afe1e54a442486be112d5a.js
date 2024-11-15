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
exports.encode = exports.decode = void 0;
var _ProtobufReader_1 = require("../$ProtobufReader");
var _ProtobufSizer_1 = require("../$ProtobufSizer");
var _ProtobufWriter_1 = require("../$ProtobufWriter");
var _strlen_1 = require("../$strlen");
var _throws_1 = require("../$throws");
var is_1 = require("../is");
var decode = function (method) { return (__assign(__assign({}, (0, is_1.is)()), { Reader: _ProtobufReader_1.$ProtobufReader, throws: (0, _throws_1.$throws)("protobuf.".concat(method)) })); };
exports.decode = decode;
var encode = function (method) { return (__assign(__assign({}, (0, is_1.is)()), { Sizer: _ProtobufSizer_1.$ProtobufSizer, Writer: _ProtobufWriter_1.$ProtobufWriter, strlen: _strlen_1.$strlen, throws: (0, _throws_1.$throws)(method) })); };
exports.encode = encode;
//# sourceMappingURL=protobuf.js.map