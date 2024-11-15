module.export({parse:()=>parse});let lexer;module.link('json-lexer',{default(v){lexer=v}},0);let decorateOffsets,extractNextToken,isPrimitiveToken,jumpWhitespace,nextNonWhitespaceToken;module.link('./tokens.js',{decorateOffsets(v){decorateOffsets=v},extractNextToken(v){extractNextToken=v},isPrimitiveToken(v){isPrimitiveToken=v},jumpWhitespace(v){jumpWhitespace=v},nextNonWhitespaceToken(v){nextNonWhitespaceToken=v}},1);

function getParseOptions(options) {
    return {
        includeValueTokens: false,
        ...options,
    };
}
function parse(json, options) {
    const ctx = {
        options: getParseOptions(options),
    };
    if (json.trim().length === 0)
        throw new Error(`Invalid JSON: must not be an empty string`);
    const tokens = decorateOffsets(lexer(json));
    let pos = 0;
    const before = jumpWhitespace(tokens, pos);
    pos += before.inc;
    const { consumedTokens, node } = makeJsonAny(tokens, pos, ctx);
    const valueTokens = ctx.options.includeValueTokens
        ? tokens.slice(pos, pos + consumedTokens)
        : [];
    pos += consumedTokens;
    const after = jumpWhitespace(tokens, pos);
    pos += after.inc;
    const whitespaceBefore = before.whitespaceToken;
    const whitespaceAfter = after.whitespaceToken;
    const doc = {
        root: node,
        whitespaceBefore,
        valueTokens,
        whitespaceAfter,
    };
    return doc;
}
function makeRange(startToken, endToken = startToken) {
    return {
        start: startToken.offset,
        end: endToken.offset + endToken.raw.length,
    };
}
function makeJsonPrimitive(token) {
    return token.type === 'string'
        ? { kind: 'string', token, range: makeRange(token) }
        : token.type === 'number'
            ? { kind: 'number', token, range: makeRange(token) }
            : { kind: 'literal', token, range: makeRange(token) };
}
function ensureType(tokens, pos, type, punctuation) {
    const token = tokens[pos];
    if (!token)
        throw new Error(`Failed to parse JSON as token pos ${pos}`);
    else if (token.type !== type)
        throw new Error(`Failed to parse JSON at pos ${token.offset}, ` +
            `expected ${type} got ${token.type}`);
    else if (punctuation && token.value !== punctuation)
        throw new Error(`Failed to parse JSON at pos ${token.offset} of type ${type}, ` +
            `expected punctuation ${punctuation} got ${token.value}`);
}
function readColon(tokens, pos) {
    let i = pos;
    const before = jumpWhitespace(tokens, i);
    i += before.inc;
    ensureType(tokens, i, 'punctuator', ':');
    const punctuatorToken = tokens[i++];
    const after = jumpWhitespace(tokens, i);
    i += after.inc;
    return {
        node: {
            kind: 'object-property-colon',
            range: makeRange(tokens[pos], tokens[i - 1]),
            whitespaceBefore: before.whitespaceToken,
            punctuatorToken,
            whitespaceAfter: after.whitespaceToken,
        },
        consumedTokens: i - pos,
    };
}
// tokens begin _inside_ the '{'
function makeJsonObject(tokens, pos, ctx) {
    var _a;
    const kind = 'object';
    const children = [];
    let whitespaceAfterChildren;
    let i = pos;
    for (; i < tokens.length;) {
        const propStartToken = tokens[i];
        const firstToken = nextNonWhitespaceToken(tokens, i);
        if (firstToken.type === 'punctuator' && firstToken.value === '}') {
            const whitespace = jumpWhitespace(tokens, i);
            whitespaceAfterChildren = whitespace.whitespaceToken;
            i += whitespace.inc + 1; // Consume both whitespace and '}'
            break;
        }
        const before = jumpWhitespace(tokens, i);
        i += before.inc;
        ensureType(tokens, i, 'string');
        const keyToken = tokens[i++];
        const colon = readColon(tokens, i);
        i += colon.consumedTokens;
        const value = makeJsonAny(tokens, i, ctx);
        const valueTokens = ctx.options.includeValueTokens
            ? tokens.slice(i, i + value.consumedTokens)
            : [];
        i += value.consumedTokens;
        // Figure out if there's a comma (and another prop) or end-of-object
        const nextToken = nextNonWhitespaceToken(tokens, i);
        const nextIsComma = nextToken.type === 'punctuator' && nextToken.value === ',';
        const beforeComma = nextIsComma
            ? extractNextToken(tokens, i)
            : {};
        i += (_a = beforeComma.consumedTokens) !== null && _a !== void 0 ? _a : 0;
        children.push({
            kind: 'object-property',
            range: makeRange(propStartToken, tokens[i]),
            whitespaceBefore: before.whitespaceToken,
            keyToken,
            key: keyToken.value,
            colon: colon.node,
            valueTokens,
            whitespaceBeforeComma: beforeComma.whitespaceToken,
            comma: beforeComma.token,
            valueNode: value.node,
        });
    }
    const consumedTokens = i - pos + 1;
    return {
        node: {
            kind,
            children,
            whitespaceAfterChildren,
            range: makeRange(tokens[pos - 1], tokens[i - 1]),
        },
        consumedTokens,
    };
}
// tokens begin _inside_ the '['
function makeJsonArray(tokens, pos, ctx) {
    var _a;
    const kind = 'array';
    const children = [];
    let whitespaceAfterChildren;
    let i = pos;
    for (; i < tokens.length;) {
        const elemStartToken = tokens[i];
        const firstToken = nextNonWhitespaceToken(tokens, i);
        if (firstToken.type === 'punctuator' && firstToken.value === ']') {
            const whitespace = jumpWhitespace(tokens, i);
            whitespaceAfterChildren = whitespace.whitespaceToken;
            i += whitespace.inc + 1; // Consume both whitespace and ']'
            break;
        }
        const before = jumpWhitespace(tokens, i);
        i += before.inc;
        const value = makeJsonAny(tokens, i, ctx);
        const valueTokens = ctx.options.includeValueTokens
            ? tokens.slice(i, i + value.consumedTokens)
            : [];
        i += value.consumedTokens;
        // Figure out if there's a comma (and another prop) or end-of-object
        const nextToken = nextNonWhitespaceToken(tokens, i);
        const nextIsComma = nextToken.type === 'punctuator' && nextToken.value === ',';
        const beforeComma = nextIsComma
            ? extractNextToken(tokens, i)
            : {};
        i += (_a = beforeComma.consumedTokens) !== null && _a !== void 0 ? _a : 0;
        children.push({
            kind: 'array-element',
            range: makeRange(elemStartToken, tokens[i]),
            whitespaceBefore: before.whitespaceToken,
            valueTokens,
            whitespaceBeforeComma: beforeComma.whitespaceToken,
            comma: beforeComma.token,
            valueNode: value.node,
        });
    }
    const consumedTokens = i - pos + 1;
    return {
        node: {
            kind,
            children,
            whitespaceAfterChildren,
            range: makeRange(tokens[pos - 1], tokens[i - 1]),
        },
        consumedTokens,
    };
}
function makeJsonAny(tokens, pos, ctx) {
    const firstToken = tokens[pos];
    if (isPrimitiveToken(firstToken))
        return {
            consumedTokens: 1,
            node: makeJsonPrimitive(firstToken),
        };
    else if (firstToken.type === 'punctuator' && firstToken.value === '{')
        return makeJsonObject(tokens, pos + 1, ctx);
    else if (firstToken.type === 'punctuator' && firstToken.value === '[')
        return makeJsonArray(tokens, pos + 1, ctx);
    throw new Error(`Failed to parse JSON at pos ${firstToken.offset}`);
}
