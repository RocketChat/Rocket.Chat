"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHTML = void 0;
var characterToHtmlEntityCode = {
    '¢': 'cent',
    '£': 'pound',
    '¥': 'yen',
    '€': 'euro',
    '©': 'copy',
    '®': 'reg',
    '™': 'trade',
    '<': 'lt',
    '>': 'gt',
    '"': 'quot',
    '&': 'amp',
    "'": '#39',
};
var regex = new RegExp("[".concat(Object.keys(characterToHtmlEntityCode).join(''), "]"), 'g');
var toString = function (object) { return (object ? "".concat(object) : ''); };
var isEscapable = function (char) {
    return char in characterToHtmlEntityCode;
};
var escapeChar = function (char) {
    return isEscapable(char) ? "&".concat(characterToHtmlEntityCode[char], ";") : '';
};
var escapeHTML = function (str) {
    return toString(str).replace(regex, escapeChar);
};
exports.escapeHTML = escapeHTML;
//# sourceMappingURL=escapeHTML.js.map