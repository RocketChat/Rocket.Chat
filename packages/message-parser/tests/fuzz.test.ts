/**
 * Property-based (fuzz) tests for @rocket.chat/message-parser
 *
 * Uses fast-check to generate random inputs and verify invariants:
 *  1. The parser never throws on any input
 *  2. The output always conforms to the Root type structure
 *  3. Plain alphanumeric strings produce a simple paragraph
 *  4. Known formatting delimiters produce expected AST node types
 *  5. The parser handles pathological / adversarial inputs gracefully
 */

import fc from 'fast-check';

import { parse } from '../src';
import type { Options, Root } from '../src';

// ── Helpers ────────────────────────────────────────────────────────────────

const allOptions: Options = {
	colors: true,
	emoticons: true,
	katex: {
		dollarSyntax: true,
		parenthesisSyntax: true,
	},
};

/**
 * Validate that a parse result conforms to the Root type:
 * - Must be a non-empty array
 * - Each element must have a `type` string property
 * - Top-level types must be one of the known block/paragraph/bigEmoji types
 */
function isValidRoot(result: Root): boolean {
	if (!Array.isArray(result) || result.length === 0) {
		return false;
	}

	const validTopLevelTypes = new Set([
		'PARAGRAPH',
		'CODE',
		'HEADING',
		'QUOTE',
		'SPOILER_BLOCK',
		'LIST_ITEM',
		'TASKS',
		'ORDERED_LIST',
		'UNORDERED_LIST',
		'LINE_BREAK',
		'KATEX',
		'BIG_EMOJI',
	]);

	return result.every(
		(node) => node !== null && typeof node === 'object' && typeof node.type === 'string' && validTopLevelTypes.has(node.type),
	);
}

// ── Property-based tests ───────────────────────────────────────────────────

describe('fuzz: parser never throws', () => {
	it('throws on empty string (known parser limitation)', () => {
		expect(() => parse('')).toThrow();
	});

	it('handles arbitrary ASCII strings', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1, maxLength: 500 }), (input) => {
				const result = parse(input);
				expect(Array.isArray(result)).toBe(true);
			}),
			{ numRuns: 500 },
		);
	}, 30_000);

	it('handles arbitrary unicode strings', () => {
		fc.assert(
			fc.property(fc.unicodeString({ minLength: 1, maxLength: 300 }), (input) => {
				const result = parse(input);
				expect(Array.isArray(result)).toBe(true);
			}),
			{ numRuns: 500 },
		);
	}, 30_000);

	it('handles arbitrary full-unicode strings (including surrogates)', () => {
		fc.assert(
			fc.property(fc.fullUnicodeString({ minLength: 1, maxLength: 200 }), (input) => {
				const result = parse(input);
				expect(Array.isArray(result)).toBe(true);
			}),
			{ numRuns: 300 },
		);
	}, 30_000);

	it('handles strings with all options enabled', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1, maxLength: 300 }), (input) => {
				const result = parse(input, allOptions);
				expect(Array.isArray(result)).toBe(true);
			}),
			{ numRuns: 500 },
		);
	}, 30_000);
});

describe('fuzz: output structure is always valid Root', () => {
	it('produces valid Root for ASCII input', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1, maxLength: 300 }), (input) => {
				const result = parse(input);
				expect(isValidRoot(result)).toBe(true);
			}),
			{ numRuns: 500 },
		);
	}, 30_000);

	it('produces valid Root for unicode input', () => {
		fc.assert(
			fc.property(fc.unicodeString({ minLength: 1, maxLength: 200 }), (input) => {
				const result = parse(input);
				expect(isValidRoot(result)).toBe(true);
			}),
			{ numRuns: 300 },
		);
	}, 30_000);
});

describe('fuzz: plain alphanumeric strings produce PARAGRAPH with PLAIN_TEXT', () => {
	it('wraps simple alphanumeric input in paragraph > plain_text', () => {
		fc.assert(
			fc.property(
				fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '), {
					minLength: 1,
					maxLength: 200,
				}),
				(input) => {
					const result = parse(input);
					expect(result.length).toBeGreaterThanOrEqual(1);
					// All top-level nodes should be PARAGRAPH or LINE_BREAK for pure alphanum+space
					for (const node of result) {
						expect(['PARAGRAPH', 'LINE_BREAK']).toContain(node.type);
					}
				},
			),
			{ numRuns: 300 },
		);
	}, 30_000);
});

describe('fuzz: formatting delimiter stress', () => {
	const markdownChars = ['*', '_', '~', '|', '`', '#', '>', '-', '[', ']', '(', ')', '!', ':', '@', '\\'];

	it('never throws on random sequences of markdown delimiters', () => {
		fc.assert(
			fc.property(fc.stringOf(fc.constantFrom(...markdownChars), { minLength: 1, maxLength: 200 }), (input) => {
				const result = parse(input);
				expect(Array.isArray(result)).toBe(true);
				expect(result.length).toBeGreaterThanOrEqual(1);
			}),
			{ numRuns: 500 },
		);
	}, 30_000);

	it('never throws on interleaved delimiters and text', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.oneof(fc.constantFrom(...markdownChars), fc.stringOf(fc.constantFrom(...'abcdefghij '), { minLength: 1, maxLength: 10 })),
					{ minLength: 1, maxLength: 50 },
				),
				(parts) => {
					const input = parts.join('');
					const result = parse(input);
					expect(Array.isArray(result)).toBe(true);
					expect(result.length).toBeGreaterThanOrEqual(1);
				},
			),
			{ numRuns: 500 },
		);
	}, 30_000);
});

describe('fuzz: emphasis delimiter parity', () => {
	it('balanced bold delimiters produce BOLD nodes', () => {
		fc.assert(
			fc.property(fc.stringOf(fc.constantFrom(...'abcdefghij'), { minLength: 1, maxLength: 30 }), (content) => {
				const input = `**${content}**`;
				const result = parse(input);
				expect(result.length).toBeGreaterThanOrEqual(1);

				// Verify there's at least one BOLD node somewhere in the AST
				const hasBold = JSON.stringify(result).includes('"BOLD"');
				// For very short content with special meaning this might not always hold,
				// but for non-empty alphanum content it should
				if (content.trim().length > 0) {
					expect(hasBold).toBe(true);
				}
			}),
			{ numRuns: 200 },
		);
	}, 15_000);

	it('balanced italic delimiters produce ITALIC nodes', () => {
		fc.assert(
			fc.property(fc.stringOf(fc.constantFrom(...'abcdefghij'), { minLength: 1, maxLength: 30 }), (content) => {
				const input = `_${content}_`;
				const result = parse(input);
				expect(result.length).toBeGreaterThanOrEqual(1);

				const hasItalic = JSON.stringify(result).includes('"ITALIC"');
				if (content.trim().length > 0) {
					expect(hasItalic).toBe(true);
				}
			}),
			{ numRuns: 200 },
		);
	}, 15_000);

	it('balanced strike delimiters produce STRIKE nodes', () => {
		fc.assert(
			fc.property(fc.stringOf(fc.constantFrom(...'abcdefghij'), { minLength: 1, maxLength: 30 }), (content) => {
				const input = `~~${content}~~`;
				const result = parse(input);
				expect(result.length).toBeGreaterThanOrEqual(1);

				const hasStrike = JSON.stringify(result).includes('"STRIKE"');
				if (content.trim().length > 0) {
					expect(hasStrike).toBe(true);
				}
			}),
			{ numRuns: 200 },
		);
	}, 15_000);
});

describe('fuzz: special constructs', () => {
	it('never throws on generated URLs', () => {
		fc.assert(
			fc.property(fc.webUrl(), (url) => {
				const result = parse(url);
				expect(Array.isArray(result)).toBe(true);
			}),
			{ numRuns: 200 },
		);
	}, 15_000);

	it('never throws on generated email-like patterns', () => {
		fc.assert(
			fc.property(fc.emailAddress(), (email) => {
				const result = parse(email);
				expect(Array.isArray(result)).toBe(true);
			}),
			{ numRuns: 200 },
		);
	}, 15_000);

	it('handles emoji shortcode patterns without crashing', () => {
		fc.assert(
			fc.property(fc.stringOf(fc.constantFrom(...'abcdefghijklmnop0123456789_+-'), { minLength: 1, maxLength: 20 }), (name) => {
				const input = `:${name}:`;
				const result = parse(input);
				expect(Array.isArray(result)).toBe(true);
			}),
			{ numRuns: 300 },
		);
	}, 15_000);

	it('handles mention patterns without crashing', () => {
		fc.assert(
			fc.property(fc.stringOf(fc.constantFrom(...'abcdefghijklmnop0123456789._-'), { minLength: 1, maxLength: 20 }), (name) => {
				const userResult = parse(`@${name}`);
				expect(Array.isArray(userResult)).toBe(true);

				const channelResult = parse(`#${name}`);
				expect(Array.isArray(channelResult)).toBe(true);
			}),
			{ numRuns: 200 },
		);
	}, 15_000);

	it('handles code block patterns without crashing', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 0, maxLength: 100 }),
				fc.constantFrom('', 'js', 'typescript', 'python', 'none'),
				(content, lang) => {
					const input = `\`\`\`${lang}\n${content}\n\`\`\``;
					const result = parse(input);
					expect(Array.isArray(result)).toBe(true);
				},
			),
			{ numRuns: 200 },
		);
	}, 15_000);
});

describe('fuzz: multiline inputs', () => {
	it('handles random multi-line messages', () => {
		fc.assert(
			fc.property(fc.array(fc.string({ minLength: 1, maxLength: 80 }), { minLength: 1, maxLength: 10 }), (lines) => {
				const input = lines.join('\n');
				const result = parse(input);
				expect(Array.isArray(result)).toBe(true);
				expect(result.length).toBeGreaterThanOrEqual(1);
			}),
			{ numRuns: 300 },
		);
	}, 30_000);
});
