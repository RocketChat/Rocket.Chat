import { parseBold, parseItalic, parseInlineCode } from '../src/parser/inlineParser';

describe('Handwritten Bold Parser', () => {
    it('should parse simple bold text', () => {
        const [result, _pos] = parseBold('*hello*', 0);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('BOLD');
        expect(result?.value).toEqual([{ type: 'PLAIN_TEXT', value: 'hello' }]);
    });

    it('should parse double asterisk bold', () => {
        const [result, _pos] = parseBold('**hello**', 0);
        expect(result?.type).toBe('BOLD');
        expect(result?.value).toEqual([{ type: 'PLAIN_TEXT', value: 'hello' }]);
    });

    it('should parse bold with user mention', () => {
        const [result, _pos] = parseBold('*hello @Matheus*', 0);
        expect(result?.value).toEqual([
            { type: 'PLAIN_TEXT', value: 'hello ' },
            { type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'Matheus' } }
        ]);
    });

    it('should backtrack if closing delimiter missing', () => {
        const [result, pos] = parseBold('*hello', 0);
        expect(result).toBeNull();
        expect(pos).toBe(0);
    });
});

describe('Handwritten Italic Parser', () => {
    it('should parse simple italic text', () => {
        const [result, _pos] = parseItalic('_hello_', 0);
        expect(result?.type).toBe('ITALIC');
        expect(result?.value).toEqual([{ type: 'PLAIN_TEXT', value: 'hello' }]);
    });

    it('should parse double underscore italic', () => {
        const [result, _pos] = parseItalic('__hello__', 0);
        expect(result?.type).toBe('ITALIC');
        expect(result?.value).toEqual([{ type: 'PLAIN_TEXT', value: 'hello' }]);
    });

    it('should parse italic with channel mention', () => {
        const [result, _pos] = parseItalic('_hello #GENERAL_', 0);
        expect(result?.value).toEqual([
            { type: 'PLAIN_TEXT', value: 'hello ' },
            { type: 'MENTION_CHANNEL', value: { type: 'PLAIN_TEXT', value: 'GENERAL' } }
        ]);
    });

    it('should backtrack if closing delimiter missing', () => {
        const [result, pos] = parseItalic('_hello', 0);
        expect(result).toBeNull();
        expect(pos).toBe(0);
    });
});

describe('Handwritten InlineCode Parser', () => {
    it('should parse simple inline code', () => {
        const [result, _pos] = parseInlineCode('`hello`', 0);
        expect(result?.type).toBe('INLINE_CODE');
        expect(result?.value).toEqual({ type: 'PLAIN_TEXT', value: 'hello' });
    });

    it('should treat content as plain text — no mention parsing', () => {
        const [result, _pos] = parseInlineCode('`@user`', 0);
        expect(result?.value).toEqual({ type: 'PLAIN_TEXT', value: '@user' });
    });

    it('should backtrack if closing backtick missing', () => {
        const [result, pos] = parseInlineCode('`hello', 0);
        expect(result).toBeNull();
        expect(pos).toBe(0);
    });
});