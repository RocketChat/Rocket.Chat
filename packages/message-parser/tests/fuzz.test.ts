/**
 * Property-based / Fuzz testing for @rocket.chat/message-parser
 *
 * Uses fast-check to generate random inputs and verify structural invariants
 * of the parser's output. These tests complement the example-based tests by
 * exploring the input space far more broadly — catching edge cases that
 * hand-written examples miss.
 *
 * Verified properties:
 *  1. The parser only throws SyntaxError (PEG grammar rejection) — never
 *     TypeError, RangeError, or other unexpected runtime errors
 *  2. When parsing succeeds the output is always a valid Root (non-empty array)
 *  3. Every node in the AST carries a recognised `type` tag
 *  4. Parsing is deterministic (same input → same AST, same error → same error)
 */

import fc from 'fast-check';

import { parse } from '../src';
import type { Options, Root } from '../src';

// ── Valid AST node types ───────────────────────────────────────────────────

const VALID_NODE_TYPES = new Set([
	'PARAGRAPH',
	'PLAIN_TEXT',
	'BOLD',
	'ITALIC',
	'STRIKE',
	'CODE',
	'CODE_LINE',
	'INLINE_CODE',
	'HEADING',
	'QUOTE',
	'SPOILER',
	'SPOILER_BLOCK',
	'LINK',
	'IMAGE',
	'MENTION_USER',
	'MENTION_CHANNEL',
	'EMOJI',
	'BIG_EMOJI',
	'COLOR',
	'TASKS',
	'TASK',
	'UNORDERED_LIST',
	'ORDERED_LIST',
	'LIST_ITEM',
	'LINE_BREAK',
	'KATEX',
	'INLINE_KATEX',
	'BLOCKQUOTE',
	'TIMESTAMP',
]);

// ── Options presets ────────────────────────────────────────────────────────

const optionPresets: Options[] = [
	{},
	{ colors: true, emoticons: true },
	{ katex: { dollarSyntax: true, parenthesisSyntax: true } },
	{
		colors: true,
		emoticons: true,
		katex: { dollarSyntax: true, parenthesisSyntax: true },
	},
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Recursively collect all `type` values from an AST tree */
function collectTypes(node: unknown): string[] {
	if (node === null || node === undefined) {
		return [];
	}

	if (Array.isArray(node)) {
		return node.flatMap(collectTypes);
	}

	if (typeof node === 'object') {
		const obj = node as Record<string, unknown>;
		const types: string[] = [];

		if (typeof obj.type === 'string') {
			types.push(obj.type);
		}

		if ('value' in obj) {
			types.push(...collectTypes(obj.value));
		}

		return types;
	}

	return [];
}

/**
 * Attempt to parse and return { ok: true, result } or { ok: false, error }.
 *
 * Critically, if the error is NOT a SyntaxError (including PEG's peg$SyntaxError)
 * we re-throw it — that would indicate a genuine parser bug (TypeError,
 * RangeError, stack overflow, etc.).
 */
function isSyntaxError(err: unknown): boolean {
	if (err instanceof SyntaxError) return true;
	// PEG.js generates peg$SyntaxError which may not properly extend SyntaxError
	if (err instanceof Error && err.name === 'SyntaxError') return true;
	return false;
}

function safeParse(input: string, options?: Options): { ok: true; result: Root } | { ok: false; error: Error } {
	try {
		return { ok: true, result: parse(input, options) };
	} catch (err) {
		if (isSyntaxError(err)) {
			return { ok: false, error: err as Error };
		}
		throw err; // Unexpected — let it fail the test
	}
}

// ── Custom arbitraries ─────────────────────────────────────────────────────

/** Markdown-aware characters that stress formatting rules */
const markdownChars = fc.constantFrom(
	'*',
	'_',
	'~',
	'`',
	'#',
	'>',
	'[',
	']',
	'(',
	')',
	'|',
	'-',
	'!',
	':',
	'@',
	'$',
	'\\',
	'\n',
	' ',
	'\t',
);

/** Strings composed of markdown-special characters — the hardest inputs for any parser */
const adversarialMarkdown = fc.array(markdownChars, { minLength: 1, maxLength: 200 }).map((chars) => chars.join(''));

/** Mixed strings: normal words interspersed with markdown syntax */
const mixedContent = fc
	.array(
		fc.oneof(
			fc.constant('**bold**'),
			fc.constant('_italic_'),
			fc.constant('~~strike~~'),
			fc.constant('`code`'),
			fc.constant(':smile:'),
			fc.constant('@user'),
			fc.constant('#channel'),
			fc.constant('https://example.com'),
			fc.constant('||spoiler||'),
			fc.constant('<t:1630360800:f>'),
			fc.constant('```\ncode\n```'),
			fc.constant('> quote'),
			fc.constant('# heading'),
			fc.constant('1. item'),
			fc.constant('- item'),
			fc.constant('- [x] task'),
			fc.lorem({ maxCount: 3 }),
		),
		{ minLength: 1, maxLength: 10 },
	)
	.map((parts) => parts.join(' '));

/** Unicode-heavy strings including emoji, CJK, RTL, and combining chars */
const unicodeStrings = fc.oneof(fc.string({ minLength: 1, maxLength: 100 }), fc.string({ minLength: 1, maxLength: 100, unit: 'grapheme' }));

/** Strings with repeated delimiters — known to stress PEG parsers */
const repeatedDelimiters = fc
	.record({
		delimiter: fc.constantFrom('**', '__', '~~', '``', '||', '```', '> ', '# ', '- '),
		count: fc.integer({ min: 2, max: 50 }),
	})
	.map(({ delimiter, count }) => delimiter.repeat(count));

/** Multi-line content with mixed block-level structures */
const multiLineContent = fc
	.array(
		fc.oneof(
			fc.lorem({ maxCount: 5 }),
			fc.constant('> blockquote line'),
			fc.constant('# heading'),
			fc.constant('```javascript'),
			fc.constant('```'),
			fc.constant('1. ordered item'),
			fc.constant('- unordered item'),
			fc.constant('- [x] checked task'),
			fc.constant('- [ ] unchecked task'),
			fc.constant(''),
		),
		{ minLength: 1, maxLength: 20 },
	)
	.map((lines) => lines.join('\n'));

// ── Property tests ─────────────────────────────────────────────────────────

describe('Property-based / Fuzz tests', () => {
	const NUM_RUNS = 500;

	describe('Robustness: parser only throws SyntaxError', () => {
		it('never throws unexpected errors for arbitrary strings', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 0, maxLength: 500 }), (input) => {
					// safeParse re-throws anything that is NOT a SyntaxError
					safeParse(input);
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('never throws unexpected errors for adversarial markdown', () => {
			fc.assert(
				fc.property(adversarialMarkdown, (input) => {
					safeParse(input);
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('never throws unexpected errors for unicode strings', () => {
			fc.assert(
				fc.property(unicodeStrings, (input) => {
					safeParse(input);
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('never throws unexpected errors for repeated delimiters', () => {
			fc.assert(
				fc.property(repeatedDelimiters, (input) => {
					safeParse(input);
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('never throws unexpected errors for mixed markdown content', () => {
			fc.assert(
				fc.property(mixedContent, (input) => {
					safeParse(input);
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('never throws unexpected errors for multi-line content', () => {
			fc.assert(
				fc.property(multiLineContent, (input) => {
					safeParse(input);
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('never throws unexpected errors across option presets', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 0, maxLength: 300 }), fc.constantFrom(...optionPresets), (input, options) => {
					safeParse(input, options);
				}),
				{ numRuns: NUM_RUNS },
			);
		});
	});

	describe('Valid AST structure', () => {
		it('always returns a non-empty array when parsing succeeds', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 1, maxLength: 300 }), (input) => {
					const r = safeParse(input);
					if (!r.ok) return; // SyntaxError is acceptable
					expect(Array.isArray(r.result)).toBe(true);
					expect(r.result.length).toBeGreaterThan(0);
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('every top-level node has a valid type', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 1, maxLength: 300 }), (input) => {
					const r = safeParse(input);
					if (!r.ok) return;
					for (const node of r.result) {
						expect(node).toHaveProperty('type');
						expect(VALID_NODE_TYPES).toContain(node.type);
					}
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('all nested nodes have valid types', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 1, maxLength: 300 }), (input) => {
					const r = safeParse(input);
					if (!r.ok) return;
					const allTypes = collectTypes(r.result);
					for (const type of allTypes) {
						expect(VALID_NODE_TYPES).toContain(type);
					}
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('all nested nodes have valid types with adversarial input', () => {
			fc.assert(
				fc.property(adversarialMarkdown, (input) => {
					const r = safeParse(input);
					if (!r.ok) return;
					const allTypes = collectTypes(r.result);
					for (const type of allTypes) {
						expect(VALID_NODE_TYPES).toContain(type);
					}
				}),
				{ numRuns: NUM_RUNS },
			);
		});
	});

	describe('Determinism: same input always produces same AST', () => {
		it('is deterministic for arbitrary strings', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 0, maxLength: 300 }), (input) => {
					const a = safeParse(input);
					const b = safeParse(input);
					// Both must agree on success / failure
					expect(a.ok).toBe(b.ok);
					if (a.ok && b.ok) {
						expect(JSON.stringify(a.result)).toBe(JSON.stringify(b.result));
					}
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('is deterministic for adversarial markdown', () => {
			fc.assert(
				fc.property(adversarialMarkdown, (input) => {
					const a = safeParse(input);
					const b = safeParse(input);
					expect(a.ok).toBe(b.ok);
					if (a.ok && b.ok) {
						expect(JSON.stringify(a.result)).toBe(JSON.stringify(b.result));
					}
				}),
				{ numRuns: NUM_RUNS },
			);
		});

		it('is deterministic across option presets', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 1, maxLength: 200 }), fc.constantFrom(...optionPresets), (input, options) => {
					const a = safeParse(input, options);
					const b = safeParse(input, options);
					expect(a.ok).toBe(b.ok);
					if (a.ok && b.ok) {
						expect(JSON.stringify(a.result)).toBe(JSON.stringify(b.result));
					}
				}),
				{ numRuns: NUM_RUNS },
			);
		});
	});

	describe('Edge cases', () => {
		it('empty string is rejected by the PEG grammar', () => {
			const result = safeParse('');
			expect(result.ok).toBe(false);
		});

		it('handles strings of only whitespace without unexpected errors', () => {
			fc.assert(
				fc.property(
					fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 }).map((a) => a.join('')),
					(input) => {
						safeParse(input);
					},
				),
				{ numRuns: 100 },
			);
		});

		it('handles very long inputs without hanging', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 500, maxLength: 2000 }), (input) => {
					const start = Date.now();
					safeParse(input);
					const elapsed = Date.now() - start;
					// Parser should not take more than 5 seconds for any single input
					expect(elapsed).toBeLessThan(5000);
				}),
				{ numRuns: 50 },
			);
		});

		it('handles null bytes and control characters without unexpected errors', () => {
			fc.assert(
				fc.property(
					fc
						.array(
							fc.integer({ min: 0, max: 31 }).map((n) => String.fromCharCode(n)),
							{
								minLength: 1,
								maxLength: 100,
							},
						)
						.map((a) => a.join('')),
					(input) => {
						safeParse(input);
					},
				),
				{ numRuns: 200 },
			);
		});

		it('handles deeply nested markdown markers', () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 20 }), (depth) => {
					const open = '**_'.repeat(depth);
					const close = '_**'.repeat(depth);
					const input = `${open}content${close}`;
					safeParse(input);
				}),
				{ numRuns: 100 },
			);
		});

		it('handles alternating code fences', () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 10 }), (count) => {
					const input = Array.from({ length: count }, (_, i) => (i % 2 === 0 ? '```\ncode\n```' : 'text')).join('\n');
					safeParse(input);
				}),
				{ numRuns: 50 },
			);
		});
	});
});
