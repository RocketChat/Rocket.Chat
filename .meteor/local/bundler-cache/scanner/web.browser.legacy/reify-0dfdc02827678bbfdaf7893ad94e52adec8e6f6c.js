"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unescapeHTML = void 0;
var htmlEntityCodeToCharacter = {
    nbsp: ' ',
    cent: '¢',
    pound: '£',
    yen: '¥',
    euro: '€',
    copy: '©',
    reg: '®',
    trade: '™',
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'",
};
var toString = function (object) { return (object ? "" + object : ''); };
var isHtmlEntityCode = function (htmlEntityCode) {
    return htmlEntityCode in htmlEntityCodeToCharacter;
};
var unescapeHTML = function (str) {
    return toString(str).replace(/\&([^;]{1,10});/g, function (entity, htmlEntityCode) {
        var match;
        if (isHtmlEntityCode(htmlEntityCode)) {
            return htmlEntityCodeToCharacter[htmlEntityCode];
        }
        match = htmlEntityCode.match(/^#x([\da-fA-F]+)$/);
        if (match) {
            return String.fromCharCode(parseInt(match[1], 16));
        }
        match = htmlEntityCode.match(/^#(\d+)$/);
        if (match) {
            return String.fromCharCode(~~match[1]);
        }
        return entity;
    });
};
exports.unescapeHTML = unescapeHTML;
//# sourceMappingURL=unescapeHTML.js.map