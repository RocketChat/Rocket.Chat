module.export({truncateEnd:()=>truncateEnd});let ellipsis;module.link('../utils',{ellipsis(v){ellipsis=v}},0);
/**
 * A truncation feature where the ellipsis will be placed at the end of the URL.
 *
 * @param {String} anchorText
 * @param {Number} truncateLen The maximum length of the truncated output URL string.
 * @param {String} ellipsisChars The characters to place within the url, e.g. "..".
 * @return {String} The truncated URL.
 */
function truncateEnd(anchorText, truncateLen, ellipsisChars) {
    return ellipsis(anchorText, truncateLen, ellipsisChars);
}
//# sourceMappingURL=truncate-end.js.map