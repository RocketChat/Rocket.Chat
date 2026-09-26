import { makeToken, TokenKind } from '../../src/lexer/Token';
import { TokenStream } from '../../src/parser/TokenStream';

describe('TokenStream', () => {
    const tokens = [
        makeToken(TokenKind.TEXT, 'hello', 'hello', 0),
        makeToken(TokenKind.WHITESPACE, ' ', ' ', 5),
        makeToken(TokenKind.NEWLINE, '\n', '\n', 6),
        makeToken(TokenKind.TEXT, 'world', 'world', 6),
        makeToken(TokenKind.EOF, '', '', 11),
    ];

    let stream: TokenStream;

    beforeEach(() => {
        stream = new TokenStream(tokens);
    });

    test('peek returns current token and supports offset', () => {
        expect(stream.peek().kind).toBe(TokenKind.TEXT);
        expect(stream.peek(1).kind).toBe(TokenKind.WHITESPACE);
        expect(stream.peek(2).kind).toBe(TokenKind.NEWLINE);
        expect(stream.peek(10).kind).toBe(TokenKind.EOF);
        expect(stream.peek(-1).kind).toBe(TokenKind.EOF);
    });

    test('advance moves the cursor and returns the previous token', () => {
        expect(stream.advance().kind).toBe(TokenKind.TEXT);
        expect(stream.peek().kind).toBe(TokenKind.WHITESPACE);
        expect(stream.advance().kind).toBe(TokenKind.WHITESPACE);
        expect(stream.advance().kind).toBe(TokenKind.NEWLINE);
        expect(stream.peek().kind).toBe(TokenKind.TEXT);
    });

    test('at returns whether the current token matches kind', () => {
        expect(stream.at(TokenKind.TEXT)).toBe(true);
        expect(stream.at(TokenKind.WHITESPACE)).toBe(false);

        stream.advance();
        expect(stream.at(TokenKind.WHITESPACE)).toBe(true);
    });

    test('eat consumes a token when the kind matches', () => {
        const eaten = stream.eat(TokenKind.TEXT);

        expect(eaten).toBeDefined();
        expect(eaten?.kind).toBe(TokenKind.TEXT);
        expect(stream.peek().kind).toBe(TokenKind.WHITESPACE);
    });

    test('eat returns undefined and does not advance when the kind does not match', () => {
        const eaten = stream.eat(TokenKind.WHITESPACE);

        expect(eaten).toBeUndefined();
        expect(stream.peek().kind).toBe(TokenKind.TEXT);
    });

    test('expect consumes a token when kind matches', () => {
        const token = stream.expect(TokenKind.TEXT);

        expect(token.kind).toBe(TokenKind.TEXT);
        expect(stream.peek().kind).toBe(TokenKind.WHITESPACE);
    });

    test('expect throws when kind does not match', () => {
        expect(() => stream.expect(TokenKind.WHITESPACE)).toThrow(
            'Expected token kind "WHITESPACE", got "TEXT" at position 0',
        );
    });

    test('isEOF reports end-of-stream state', () => {
        expect(stream.isEOF()).toBe(false);

        stream.advance();
        stream.advance();
        stream.advance();
        stream.advance();
        stream.advance();

        expect(stream.isEOF()).toBe(true);
        expect(stream.peek().kind).toBe(TokenKind.EOF);
    });

    test('isLineStart is true at start and after newline', () => {
        expect(stream.isLineStart()).toBe(true);

        stream.advance();
        expect(stream.isLineStart()).toBe(false);

        stream.advance();
        stream.advance();
        expect(stream.isLineStart()).toBe(true);
    });

    test('mark and reset restore the stream position', () => {
        stream.advance();
        stream.advance();
        stream.advance();
        const marker = stream.mark();

        expect(stream.peek().kind).toBe(TokenKind.TEXT);

        stream.advance();
        expect(stream.peek().kind).toBe(TokenKind.EOF);

        stream.reset(marker);
        expect(stream.peek().kind).toBe(TokenKind.TEXT);
    });

    test('reset throws for invalid position values', () => {
        expect(() => stream.reset(-1)).toThrow(
            'Invalid token stream position: -1 (stream length: 5)',
        );
        expect(() => stream.reset(tokens.length + 1)).toThrow(
            'Invalid token stream position: 6 (stream length: 5)',
        );
    });
});
