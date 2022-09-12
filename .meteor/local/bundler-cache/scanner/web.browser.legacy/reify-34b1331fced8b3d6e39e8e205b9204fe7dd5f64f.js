"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateEnd = void 0;
var utils_1 = require("../utils");
/**
 * A truncation feature where the ellipsis will be placed at the end of the URL.
 *
 * @param {String} anchorText
 * @param {Number} truncateLen The maximum length of the truncated output URL string.
 * @param {String} ellipsisChars The characters to place within the url, e.g. "..".
 * @return {String} The truncated URL.
 */
function truncateEnd(anchorText, truncateLen, ellipsisChars) {
    return (0, utils_1.ellipsis)(anchorText, truncateLen, ellipsisChars);
}
exports.truncateEnd = truncateEnd;
//# sourceMappingURL=truncate-end.js.map