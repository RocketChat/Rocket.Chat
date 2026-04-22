import type { Token } from '../lexer';
import { TokenKind } from '../lexer';

const EOF_TOKEN: Token = {
    kind: TokenKind.EOF,
    raw: '',
    value: '',
    start: -1,
    end: -1,
};

export class TokenStream {
    private readonly _tokens: Token[];
    private _pos = 0;

    constructor(tokens: Token[]) {
        this._tokens = tokens;
    }

    peek(offset = 0): Token {
        const index = this._pos + offset;

        if (index < 0 || index >= this._tokens.length) {
            return EOF_TOKEN;
        }

        return this._tokens[index];
    }

    advance(): Token {
        const token = this.peek();

        if (!this.isEOF()) {
            this._pos++;
        }

        return token;
    }

    at(kind: TokenKind): boolean {
        return this.peek().kind === kind;
    }

    eat(kind: TokenKind): Token | undefined {
        if (!this.at(kind)) {
            return undefined;
        }

        return this.advance();
    }

    expect(kind: TokenKind): Token {
        const token = this.advance();

        if (token.kind !== kind) {
            throw new Error(
                `Expected token kind "${kind}", got "${token.kind}" at position ${this._pos - 1}`,
            );
        }

        return token;
    }

    isEOF(): boolean {
        return this._pos >= this._tokens.length;
    }

    isLineStart(): boolean {
        if (this._pos === 0) {
            return true;
        }

        const prev = this._tokens[this._pos - 1];
        return prev?.kind === TokenKind.NEWLINE;
    }

    mark(): number {
        return this._pos;
    }

    reset(position: number): void {
        if (position < 0 || position > this._tokens.length) {
            throw new RangeError(
                `Invalid token stream position: ${position} (stream length: ${this._tokens.length})`,
            );
        }

        this._pos = position;
    }
}
