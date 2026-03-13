import { Lexer } from '../../src/lexer/lexer';
import { TokenKind } from '../../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const kv = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => [t.kind, t.value] as const);

// ── emoji shortcodes ────────────────────────────────────────────────────────

describe('emoji shortcodes', () => {
    test('basic :smile:', () => {
        expect(kv(':smile:')).toEqual([['EMOJI_SHORTCODE', 'smile']]);
    });

    test('shortcodes with special chars in the name', () => {
        expect(kv(':thumbs-up:')).toEqual([['EMOJI_SHORTCODE', 'thumbs-up']]);
        expect(kv(':thumbs_up:')).toEqual([['EMOJI_SHORTCODE', 'thumbs_up']]);
        expect(kv(':+1:')).toEqual([['EMOJI_SHORTCODE', '+1']]);
    });

    test('unclosed : is not a shortcode', () => {
        expect(kinds(':nope')).toEqual(['TEXT']);
    });

    test(': used as a separator is not a shortcode', () => {
        expect(kinds('key:value')).toEqual(['TEXT']);
    });

    test('two shortcodes separated by space', () => {
        expect(kinds(':smile: :wave:')).toEqual([
            'EMOJI_SHORTCODE', 'WHITESPACE', 'EMOJI_SHORTCODE',
        ]);
    });

    test('shortcode glued to text on both sides', () => {
        expect(kinds('hello:smile:world')).toEqual(['TEXT', 'EMOJI_SHORTCODE', 'TEXT']);
    });
});

// ── mentions ────────────────────────────────────────────────────────────────

describe('user mentions', () => {
    test('basic @mention', () => {
        expect(kv('@john')).toEqual([['MENTION_USER', 'john']]);
    });

    test('dots and subaddresses', () => {
        expect(kv('@john.doe')).toEqual([['MENTION_USER', 'john.doe']]);
        expect(kv('@user:server')).toEqual([['MENTION_USER', 'user:server']]);
        expect(kv('@user@host')).toEqual([['MENTION_USER', 'user@host']]);
        expect(kv('@user:room@server')).toEqual([['MENTION_USER', 'user:room@server']]);
    });

    test('trailing : with nothing valid after it stops the mention', () => {
        const result = kv('@user:');
        expect(result[0]).toEqual(['MENTION_USER', 'user']);
    });

    test('separator followed by space also stops', () => {
        const result = kv('@user: text');
        expect(result[0]).toEqual(['MENTION_USER', 'user']);
        expect(result.length).toBeGreaterThan(1);
    });

    test('@ alone or followed by invalid chars is text', () => {
        expect(kinds('@ ')).toEqual(['TEXT', 'WHITESPACE']);
        expect(kinds('text@')).toEqual(['TEXT']);
        expect(kinds('@!')).toEqual(['TEXT']);
        expect(kinds('@\u00e9')).toEqual(['TEXT']); // non-ASCII after @
    });

    test('mention surrounded by text', () => {
        expect(kinds('hi @user bye')).toEqual([
            'TEXT', 'WHITESPACE', 'MENTION_USER', 'WHITESPACE', 'TEXT',
        ]);
    });

    test('channel mentions with #', () => {
        expect(kv('#general')).toEqual([['MENTION_CHANNEL', 'general']]);
        expect(kv('#my-channel')).toEqual([['MENTION_CHANNEL', 'my-channel']]);
    });
});

// ── URLs ────────────────────────────────────────────────────────────────────

describe('URLs', () => {
    test('full URLs with scheme', () => {
        expect(kv('https://example.com')).toEqual([['URL', 'https://example.com']]);
        expect(kv('http://example.com')).toEqual([['URL', 'http://example.com']]);
    });

    test('URL with path and query', () => {
        expect(kv('https://example.com/path')).toEqual([['URL', 'https://example.com/path']]);
        expect(kv('https://example.com?q=1')).toEqual([['URL', 'https://example.com?q=1']]);
    });

    test('URL surrounded by text', () => {
        expect(kinds('visit https://example.com today')).toEqual([
            'TEXT', 'WHITESPACE', 'URL', 'WHITESPACE', 'TEXT',
        ]);
    });

    test('trailing punctuation gets stripped', () => {
        const tokens = tok('https://example.com.');
        const url = tokens.find(t => t.kind === TokenKind.URL);
        expect(url?.value).toBe('https://example.com');
    });

    test('multiple trailing dots stripped', () => {
        const tokens = tok('https://example.com...');
        const url = tokens.find(t => t.kind === TokenKind.URL);
        expect(url?.value).toBe('https://example.com');
    });

    test('bare :// without a scheme is just text', () => {
        expect(kinds('://')).toEqual(['TEXT']);
    });

    test('bare domain starting with c', () => {
        expect(kv('cdn.example.com')).toEqual([['URL', 'cdn.example.com']]);
    });
});

// ── colors ──────────────────────────────────────────────────────────────────

describe('color tokens', () => {
    test('6-digit, 3-digit, uppercase', () => {
        expect(kv('color:#ff0000')).toEqual([['COLOR', 'ff0000']]);
        expect(kv('color:#abc')).toEqual([['COLOR', 'abc']]);
        expect(kv('color:#ABCDEF')).toEqual([['COLOR', 'ABCDEF']]);
    });

    test('8-digit hex matches 6 digits first (greedy alternation)', () => {
        const result = kv('color:#ff0000ff');
        expect(result[0]).toEqual(['COLOR', 'ff0000']);
    });

    test('4-digit hex matches 3 first', () => {
        const result = kv('color:#f00f');
        expect(result[0]).toEqual(['COLOR', 'f00']);
    });

    test('invalid hex after color:# falls through', () => {
        expect(kinds('color:#xyz')).toEqual(['TEXT', 'EMOTICON', 'TEXT']);
    });

    test('"c" not followed by anything special is plain text', () => {
        expect(kinds('cat')).toEqual(['TEXT']);
    });
});

// ── phone numbers and the + key ─────────────────────────────────────────────

describe('phone numbers', () => {
    test('basic and formatted', () => {
        expect(kv('+1234567890')).toEqual([['PHONE', '+1234567890']]);
        expect(kv('+1-555-1234')).toEqual([['PHONE', '+1-555-1234']]);
        expect(kv('+1(555)1234')).toEqual([['PHONE', '+1(555)1234']]);
    });

    test('+ not followed by digits is just text', () => {
        expect(kinds('+abc')).toEqual(['TEXT']);
        expect(kinds('+')).toEqual(['TEXT']);
        expect(kinds('+ hello')).toEqual(['TEXT', 'WHITESPACE', 'TEXT']);
    });
});

// ── emoticons ───────────────────────────────────────────────────────────────

describe('text emoticons', () => {
    test('smiley family', () => {
        expect(kv(':)')).toEqual([['EMOTICON', 'slight_smile']]);
        expect(kv(':D')).toEqual([['EMOTICON', 'smiley']]);
        expect(kv(':/')).toEqual([['EMOTICON', 'confused']]);
        expect(kv(':(')).toEqual([['EMOTICON', 'disappointed']]);
    });

    test('winks and glasses', () => {
        expect(kv(';)')).toEqual([['EMOTICON', 'wink']]);
        expect(kv('=)')).toEqual([['EMOTICON', 'slight_smile']]);
        expect(kv('B)')).toEqual([['EMOTICON', 'sunglasses']]);
        expect(kv('8)')).toEqual([['EMOTICON', 'sunglasses']]);
    });

    test('misc emoticons', () => {
        expect(kv('D:')).toEqual([['EMOTICON', 'fearful']]);
        expect(kv('(y)')).toEqual([['EMOTICON', 'thumbsup']]);
        expect(kv('X)')).toEqual([['EMOTICON', 'dizzy_face']]);
        expect(kv('%)')).toEqual([['EMOTICON', 'dizzy_face']]);
        expect(kv('-_-')).toEqual([['EMOTICON', 'expressionless']]);
    });

    test('hearts', () => {
        expect(kv('<3')).toEqual([['EMOTICON', 'heart']]);
        expect(kv('</3')).toEqual([['EMOTICON', 'broken_heart']]);
    });

    test('emoticon-only char that does not start an emoticon → text', () => {
        expect(kinds('yz')).toEqual(['TEXT']);
    });
});
