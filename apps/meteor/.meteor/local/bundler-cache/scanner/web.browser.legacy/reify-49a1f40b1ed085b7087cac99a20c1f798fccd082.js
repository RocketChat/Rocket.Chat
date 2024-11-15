"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$rest = void 0;
var $rest = function (str) {
    return str.length === 2 ? "" : "," + str.substring(1, str.length - 1);
};
exports.$rest = $rest;
//# sourceMappingURL=$rest.js.map