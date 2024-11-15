"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$strlen = void 0;
var $strlen = function (s) {
    var b;
    var i;
    var c;
    for (b = i = 0; (c = s.charCodeAt(i++)); b += c >> 11 ? 3 : c >> 7 ? 2 : 1)
        ;
    return b;
};
exports.$strlen = $strlen;
//# sourceMappingURL=$strlen.js.map