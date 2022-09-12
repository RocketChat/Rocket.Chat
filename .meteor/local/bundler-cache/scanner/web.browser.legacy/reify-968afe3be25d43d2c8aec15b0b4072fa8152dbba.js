"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = void 0;
var capitalize = function (s) {
    if (typeof s !== 'string') {
        return '';
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
};
exports.capitalize = capitalize;
//# sourceMappingURL=capitalize.js.map