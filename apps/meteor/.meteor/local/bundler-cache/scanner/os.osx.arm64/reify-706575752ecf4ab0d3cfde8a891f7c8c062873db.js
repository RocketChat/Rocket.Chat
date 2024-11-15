module.export({decorateOffsets:()=>decorateOffsets,isPrimitiveToken:()=>isPrimitiveToken,jumpWhitespace:()=>jumpWhitespace,extractNextToken:()=>extractNextToken,nextNonWhitespaceToken:()=>nextNonWhitespaceToken});function decorateOffsets(tokens) {
    let offset = 0;
    return tokens.map(token => {
        const offsetToken = token;
        offsetToken.offset = offset;
        offset += token.raw.length;
        return offsetToken;
    });
}
function isPrimitiveToken(token) {
    return (token.type === 'string'
        ||
            token.type === 'number'
        ||
            token.type === 'literal');
}
;
/**
 * Returns 1 and the whitespace token, or 0
 */
function jumpWhitespace(tokens, pos) {
    const token = tokens[pos];
    return (token === null || token === void 0 ? void 0 : token.type) === 'whitespace'
        ? { inc: 1, whitespaceToken: token }
        : { inc: 0 };
}
function extractNextToken(tokens, pos) {
    const whitespace = jumpWhitespace(tokens, pos);
    const token = tokens[pos + whitespace.inc];
    ++whitespace.inc;
    return {
        whitespaceToken: whitespace.whitespaceToken,
        consumedTokens: whitespace.inc,
        token,
    };
}
function nextNonWhitespaceToken(tokens, pos) {
    const whitespace = jumpWhitespace(tokens, pos);
    return tokens[pos + whitespace.inc];
}
