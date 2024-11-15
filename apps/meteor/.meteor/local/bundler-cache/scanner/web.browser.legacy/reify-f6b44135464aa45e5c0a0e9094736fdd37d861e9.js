"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$join = void 0;
var $join = function (str) {
    return variable(str) ? ".".concat(str) : "[".concat(JSON.stringify(str), "]");
};
exports.$join = $join;
var variable = function (str) {
    return reserved(str) === false && /^[a-zA-Z_$][a-zA-Z_$0-9]*$/g.test(str);
};
var reserved = function (str) { return RESERVED.has(str); };
var RESERVED = new Set([
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
]);
//# sourceMappingURL=$join.js.map