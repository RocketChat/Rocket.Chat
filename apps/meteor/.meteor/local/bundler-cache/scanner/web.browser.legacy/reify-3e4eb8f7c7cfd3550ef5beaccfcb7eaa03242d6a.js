"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.parameter = exports.headers = exports.formData = void 0;
var _FormDataReader_1 = require("../$FormDataReader");
var _HeadersReader_1 = require("../$HeadersReader");
var _ParameterReader_1 = require("../$ParameterReader");
var _QueryReader_1 = require("../$QueryReader");
var formData = function () { return _FormDataReader_1.$FormDataReader; };
exports.formData = formData;
var headers = function () { return _HeadersReader_1.$HeadersReader; };
exports.headers = headers;
var parameter = function () { return _ParameterReader_1.$ParameterReader; };
exports.parameter = parameter;
var query = function () { return _QueryReader_1.$QueryReader; };
exports.query = query;
//# sourceMappingURL=http.js.map