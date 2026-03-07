import { Lexer } from '../src/lexer/lexer';
import { TokenKind } from '../src/lexer/Token';
import type { Token } from '../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const raw = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => t.raw).join('');

// ── boundary inputs ─────────────────────────────────────────────────────────

describe('boundary inputs', () => {
    test('empty string gives just EOF', () => {
        expect(tok('').map(t => t.kind)).toEqual(['EOF']);
    });

    test('single char, single space, single newline, single marker', () => {
        expect(kinds('a')).toEqual(['TEXT']);
        expect(kinds(' ')).toEqual(['WHITESPACE']);
        expect(kinds('\n')).toEqual(['NEWLINE']);
        expect(kinds('*')).toEqual(['ASTERISK']);
    });
});

// ── whitespace-only and special-only ────────────────────────────────────────

describe('degenerate inputs', () => {
    test('all spaces', () => {
        expect(kinds('     ')).toEqual(['WHITESPACE']);
    });

    test('all newlines', () => {
        expect(kinds('\n\n\n')).toEqual(['NEWLINE', 'NEWLINE', 'NEWLINE']);
    });

    test('just formatting markers', () => {
        expect(kinds('*_~')).toEqual(['ASTERISK', 'UNDERSCORE', 'TILDE']);
        expect(kinds('[]()')).toEqual(['LINK_OPEN', 'LINK_HREF_OPEN', 'LINK_HREF_CLOSE']);
    });
});

// ── token positions ─────────────────────────────────────────────────────────

describe('token position invariants', () => {
    function checkPositions(tokens: Token[]) {
        for (const t of tokens) {
            expect(t.end).toBe(t.start + t.raw.length);
        }
        for (let i = 1; i < tokens.length; i++) {
            expect(tokens[i].start).toBe(tokens[i - 1].end);
        }
    }

    test('every token: end = start + raw.length', () => {
        checkPositions(tok('**bold** and _italic_ `code`'));
    });

    test('tokens are contiguous with no gaps', () => {
        checkPositions(tok('# Hello **world** :smile:'));
    });

    test('first token at 0, EOF at input.length', () => {
        const input = 'test input';
        const tokens = tok(input);
        expect(tokens[0].start).toBe(0);
        expect(tokens[tokens.length - 1].start).toBe(input.length);
    });

    test('holds on a complex mixed input', () => {
        const input = '# **bold** _italic_ ~~struck~~ `code` :smile: @user #channel > quote\n- list\n1. ordered\n- [x] task';
        checkPositions(tok(input));
    });

    test('holds for surrogate-pair emoji', () => {
        checkPositions(tok('😀 text 🚀'));
    });
});

// ── round-trips ─────────────────────────────────────────────────────────────

describe('round-trip: join all raw tokens = original input', () => {
    test.each([
        'hello world',
        '# **bold** and _italic_ with ~~strike~~',
        '```js\nfoo();\n```',
        ':smile: @user #channel',
        '> - [x] ~~done~~ https://example.com',
        '\\*not bold\\* and \\_not italic\\_',
        '$x^2$ and $$E=mc^2$$ and \\[a\\] and \\(b\\)',
        '[title](url) and ![alt](src) and <angle>',
        '*_~`#$|><![]()',
        '',
    ])('%s', (input) => {
        expect(raw(input)).toBe(input);
    });
});

// ── integrated content ──────────────────────────────────────────────────────

describe('mixed content', () => {
    test('heading with bold and code', () => {
        expect(kinds('# **title** `inline`')).toEqual([
            'HEADING_MARKER', 'WHITESPACE', 'ASTERISK', 'TEXT', 'ASTERISK',
            'WHITESPACE', 'BACKTICK', 'CODE_CONTENT', 'BACKTICK',
        ]);
    });

    test('list item with emoji and link', () => {
        expect(kinds('- :smile: [link](url)')).toEqual([
            'UL_BULLET', 'EMOJI_SHORTCODE', 'WHITESPACE',
            'LINK_OPEN', 'TEXT', 'LINK_HREF_OPEN', 'TEXT', 'LINK_HREF_CLOSE',
        ]);
    });

    test('blockquote with formatting', () => {
        expect(kinds('> **bold** _italic_')).toEqual([
            'BLOCKQUOTE_MARKER', 'WHITESPACE', 'ASTERISK', 'TEXT', 'ASTERISK',
            'WHITESPACE', 'UNDERSCORE', 'TEXT', 'UNDERSCORE',
        ]);
    });

    test('spoiler wrapping a mention', () => {
        expect(kinds('||@user||')).toEqual(['SPOILER_FENCE', 'MENTION_USER', 'SPOILER_FENCE']);
    });

    test('task checkbox with strikethrough', () => {
        expect(kinds('- [x] ~~done~~')).toEqual(['TASK_BULLET', 'TILDE', 'TEXT', 'TILDE']);
    });

    test('multiline combo', () => {
        expect(kinds('# Title\n> quote\n- item\n1. ordered')).toEqual([
            'HEADING_MARKER', 'WHITESPACE', 'TEXT', 'NEWLINE',
            'BLOCKQUOTE_MARKER', 'WHITESPACE', 'TEXT', 'NEWLINE',
            'UL_BULLET', 'TEXT', 'NEWLINE',
            'OL_BULLET', 'TEXT',
        ]);
    });
});

// ── MAX_TOKENS ──────────────────────────────────────────────────────────────

describe('MAX_TOKENS guard', () => {
    test('extremely long input does not crash', () => {
        const tokens = tok('a '.repeat(5000));
        expect(tokens.length).toBeGreaterThan(0);
        expect(tokens[tokens.length - 1].kind).toBe(TokenKind.EOF);
    });

    test('respects the 4096 token limit', () => {
        const tokens = tok('a '.repeat(3000));
        expect(tokens.length).toBeLessThanOrEqual(4097);
    });

    test('flushes any pending text when the guard trips', () => {
        const tokens = tok('* '.repeat(2048) + 'trailing text');
        expect(tokens[tokens.length - 1].kind).toBe(TokenKind.EOF);
        expect(tokens.length).toBeLessThanOrEqual(4098);
    });
});

// ── unicode emoji ───────────────────────────────────────────────────────────

describe('unicode emoji', () => {
    test('BMP emoji (dingbats, symbols)', () => {
        expect(kinds('✌')).toEqual(['EMOJI_UNICODE']); // U+270C
        expect(kinds('⌚')).toEqual(['EMOJI_UNICODE']); // U+231A
    });

    test('surrogate-pair emoji from all the major blocks', () => {
        expect(kinds('😀')).toEqual(['EMOJI_UNICODE']); // U+1F600 emoticons
        expect(kinds('🚀')).toEqual(['EMOJI_UNICODE']); // U+1F680 transport
        expect(kinds('🌈')).toEqual(['EMOJI_UNICODE']); // U+1F308 misc symbols
        expect(kinds('🐶')).toEqual(['EMOJI_UNICODE']); // U+1F436 misc contd
        expect(kinds('🤖')).toEqual(['EMOJI_UNICODE']); // U+1F916 supplemental
        expect(kinds('🇺')).toEqual(['EMOJI_UNICODE']); // U+1F1FA enclosed alphanum
    });

    test('variation selectors', () => {
        expect(kinds('✌\uFE0F')).toEqual(['EMOJI_UNICODE']); // emoji presentation
        expect(kinds('✌\uFE0E')).toEqual(['EMOJI_UNICODE']); // text presentation
    });

    test('Fitzpatrick skin tone modifier', () => {
        expect(kinds('👋🏽')).toEqual(['EMOJI_UNICODE']);
    });

    test('ZWJ: surrogate + ZWJ + surrogate (the common case)', () => {
        // 👨‍💻 = man (U+1F468) + ZWJ + laptop (U+1F4BB)
        expect(kinds('👨\u200D💻')).toEqual(['EMOJI_UNICODE']);
    });

    test('ZWJ: surrogate + ZWJ + BMP emoji', () => {
        // emoji + ZWJ + ✌ (BMP dingbat) — hits the isUnicodeEmojiStart branch
        expect(kinds('😀\u200D✌')).toEqual(['EMOJI_UNICODE']);
    });

    test('ZWJ: surrogate + ZWJ + non-emoji backtracks', () => {
        // emoji + ZWJ + 'a' — 'a' isn't emoji, so the scanner backtracks
        // the ZWJ ends up in the following text token
        const tokens = tok('😀\u200Da');
        expect(tokens.some(t => t.kind === TokenKind.EMOJI_UNICODE)).toBe(true);
        expect(tokens.some(t => t.kind === TokenKind.TEXT)).toBe(true);
    });

    test('ZWJ: variation selector after the joined segment', () => {
        // emoji + ZWJ + emoji + FE0F — tests the vs2 check inside the ZWJ loop
        expect(kinds('😀\u200D✌\uFE0F')).toEqual(['EMOJI_UNICODE']);
    });

    test('ZWJ: variation selector (FE0E) after joined segment', () => {
        expect(kinds('😀\u200D✌\uFE0E')).toEqual(['EMOJI_UNICODE']);
    });

    test('ZWJ at end of input (no char after)', () => {
        // emoji + ZWJ then EOF — the while loop should break
        const tokens = tok('😀\u200D');
        expect(tokens.some(t => t.kind === TokenKind.EMOJI_UNICODE)).toBe(true);
    });

    test('multiple emoji in a row', () => {
        expect(kinds('😀🚀🌈')).toEqual(['EMOJI_UNICODE', 'EMOJI_UNICODE', 'EMOJI_UNICODE']);
    });

    test('mixed with text', () => {
        expect(kinds('hello 😀 world')).toEqual([
            'TEXT', 'WHITESPACE', 'EMOJI_UNICODE', 'WHITESPACE', 'TEXT',
        ]);
    });

    test('emoji round-trip preserves raw text', () => {
        expect(raw('hello 😀🚀 world 🌈')).toBe('hello 😀🚀 world 🌈');
    });
});

// ── non-ASCII that isn't emoji ───────────────────────────────────────────────

describe('non-ASCII text', () => {
    test('accented, Chinese, Arabic all become TEXT', () => {
        expect(kinds('café')).toEqual(['TEXT']);
        expect(kinds('你好世界')).toEqual(['TEXT']);
        expect(kinds('مرحبا')).toEqual(['TEXT']);
    });

    test('mixed with ASCII and emoji', () => {
        expect(kinds('hello café world')).toEqual([
            'TEXT', 'WHITESPACE', 'TEXT', 'WHITESPACE', 'TEXT',
        ]);
        expect(kinds('café 😀')).toEqual(['TEXT', 'WHITESPACE', 'EMOJI_UNICODE']);
    });

    test('round-trips correctly', () => {
        expect(raw('café résumé naïve über')).toBe('café résumé naïve über');
    });

    test('surrogate pairs outside emoji ranges are TEXT', () => {
        // U+10000 (Linear B Syllable) = D800 DC00 — not an emoji
        expect(kinds('\uD800\uDC00')).toEqual(['TEXT']);
    });

    test('lone high surrogate is TEXT', () => {
        expect(kinds('\uD800')).toEqual(['TEXT']);
    });
});
