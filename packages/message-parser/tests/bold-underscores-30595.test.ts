/**
 * Regression and edge-case tests for GitHub Issue #30595
 *
 * Bug: Bold formatting (`*...*`) incorrectly dropped underscores and produced
 * spurious italic nodes for inputs containing underscores preceded by
 * non-ASCII (Cyrillic, Arabic, CJK) characters or by `.`/`-` separators in
 * version-like tokens.
 *
 * Fix (one-line change to `src/grammar.pegjs`, Italic alt 1):
 *   Before: value:$([a-zA-Z0-9]+ [\x5F] [\x5F]?) { return plain(value); }
 *   After:  value:$(AlphaNumericChar (AlphaNumericChar / [.\-] AlphaNumericChar)* [\x5F] [\x5F]?)
 *             { return plain(value); }
 *
 * The fix extends the intra-word underscore guard from ASCII-only [a-zA-Z0-9]
 * to any Unicode letter/digit (AlphaNumericChar), and allows `.` or `-`
 * separators only when sandwiched between two alphanumeric characters.
 *
 * Known limitation: when a version-like token (e.g. `v1.0`, `2.5`, `1-2`)
 * is immediately followed by `_` with no space, the guard fires and the `_`
 * is treated as plain. If the author intended italic after such a token, a
 * space before `_` preserves italic (see Section F).
 */

import { bold, italic, paragraph, plain } from './helpers.js';
import { parse } from '../src/index.js';

// ---------------------------------------------------------------------------
// Section A: Original bug — cases broken before the fix, now passing
// ---------------------------------------------------------------------------

describe('Issue #30595 — original bug cases (must remain fixed)', () => {
	it('*ОЛ_1.2_2_00_ЭС* preserves all underscores as plain inside bold (Cyrillic)', () => {
		expect(parse('*ОЛ_1.2_2_00_ЭС*', { emoticons: false })).toEqual([
			paragraph([bold([plain('ОЛ_1.2_2_00_ЭС')])]),
		]);
	});

	it('*a_1.2_2_00_b* preserves all underscores as plain inside bold', () => {
		expect(parse('*a_1.2_2_00_b*', { emoticons: false })).toEqual([
			paragraph([bold([plain('a_1.2_2_00_b')])]),
		]);
	});

	it('*v2-3_4_5* preserves all underscores as plain inside bold (hyphenated version)', () => {
		expect(parse('*v2-3_4_5*', { emoticons: false })).toEqual([
			paragraph([bold([plain('v2-3_4_5')])]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section B: Already-correct cases that must remain correct
// ---------------------------------------------------------------------------

describe('Issue #30595 — already-correct cases (must remain unchanged)', () => {
	it('*v_1.2_x* stays plain (single-letter version prefix)', () => {
		expect(parse('*v_1.2_x*', { emoticons: false })).toEqual([
			paragraph([bold([plain('v_1.2_x')])]),
		]);
	});

	it('*foo_bar_baz* stays plain (pure ASCII snake_case inside bold)', () => {
		expect(parse('*foo_bar_baz*', { emoticons: false })).toEqual([
			paragraph([bold([plain('foo_bar_baz')])]),
		]);
	});

	it('*hello_world_test* stays plain (ASCII snake_case inside bold)', () => {
		expect(parse('*hello_world_test*', { emoticons: false })).toEqual([
			paragraph([bold([plain('hello_world_test')])]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section C: Nested italic preservation inside bold
// ---------------------------------------------------------------------------

describe('Issue #30595 — nested italic preserved inside bold', () => {
	it('*foo._bar_* — dot-terminated word leaves _bar_ as italic', () => {
		// Guard requires AlphaNumericChar before the first `_`, and `.` before `_`
		// does not satisfy `[.\-] AlphaNumericChar` (AlphaNumericChar is required
		// after the separator). Guard stops at "foo"; BoldPlainRun takes "foo.";
		// "_bar_" is then parsed as italic.
		expect(parse('*foo._bar_*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					plain('foo.'),
					italic([plain('bar')]),
				]),
			]),
		]);
	});

	it('*-_bar_* — leading hyphen leaves _bar_ as italic', () => {
		// "-" is not AlphaNumericChar; guard fails; BoldPlainRun takes "-";
		// "_bar_" becomes italic.
		expect(parse('*-_bar_*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					plain('-'),
					italic([plain('bar')]),
				]),
			]),
		]);
	});

	it('*foo-_bar_* — trailing hyphen leaves _bar_ as italic', () => {
		// Guard matches "foo" but "-" before "_" requires an AlphaNumericChar
		// after it — "_" is not AlphaNumericChar, so the separator is not
		// consumed. Guard stops at "foo"; next char is "-", not "_"; guard fails.
		// BoldPlainRun takes "foo-"; "_bar_" becomes italic.
		expect(parse('*foo-_bar_*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					plain('foo-'),
					italic([plain('bar')]),
				]),
			]),
		]);
	});

	it('*bold _nested italic_ text* — canonical nested italic preserved', () => {
		// BoldPlainRun consumes "bold " (stops at "_"). Cursor at "_nested…";
		// guard fails (cursor is at "_", not AlphaNumericChar). Alt 5 fires.
		expect(parse('*bold _nested italic_ text*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					plain('bold '),
					italic([plain('nested italic')]),
					plain(' text'),
				]),
			]),
		]);
	});

	it('*_3.14_* — leading underscore starts italic inside bold', () => {
		// Cursor at "_" at the start of bold content; guard fails immediately.
		// Alt 5 fires: italic wraps "3.14".
		expect(parse('*_3.14_*', { emoticons: false })).toEqual([
			paragraph([bold([italic([plain('3.14')])])]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section D: Unicode edge cases
// ---------------------------------------------------------------------------

describe('Issue #30595 — Unicode edge cases', () => {
	it('*日本語_1.2_テスト* preserves underscores (CJK characters)', () => {
		// AlphaChar covers CJK Unified Ideographs (\u4E00-\u9FD5) and Katakana.
		// Guard fires for "日本語_", "1.2_" → all plain.
		expect(parse('*日本語_1.2_テスト*', { emoticons: false })).toEqual([
			paragraph([bold([plain('日本語_1.2_テスト')])]),
		]);
	});

	it('*اختبار_١.٢_نص* preserves underscores (Arabic with Arabic-Indic digits)', () => {
		// AlphaChar covers Arabic (\u0620-\u064A) and DecimalNumberChar covers
		// Arabic-Indic digits (\u0660-\u0669). Guard fires for "اختبار_", "١.٢_".
		expect(parse('*اختبار_١.٢_نص*', { emoticons: false })).toEqual([
			paragraph([bold([plain('اختبار_١.٢_نص')])]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section E: Standalone (outside bold) — existing italic/plain behavior
// ---------------------------------------------------------------------------

describe('Issue #30595 — standalone behavior preserved (outside bold)', () => {
	it('_3.14_ outside bold remains italic', () => {
		expect(parse('_3.14_', { emoticons: false })).toEqual([
			paragraph([italic([plain('3.14')])]),
		]);
	});

	it('_italic_ remains italic', () => {
		expect(parse('_italic_', { emoticons: false })).toEqual([
			paragraph([italic([plain('italic')])]),
		]);
	});

	it('snake_case outside emphasis stays plain', () => {
		expect(parse('snake_case', { emoticons: false })).toEqual([
			paragraph([plain('snake_case')]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section F: Known limitation — unspaced italic after version-like tokens
// ---------------------------------------------------------------------------

/**
 * Known limitation of the current fix.
 *
 * The intra-word guard (Italic alt 1) consumes tokens of the form:
 *   AlphaNumericChar (AlphaNumericChar / [.\-] AlphaNumericChar)* _
 *
 * When a version-like token (e.g. "v1.0", "2.5", "step 1-2") ends with an
 * alphanumeric and is IMMEDIATELY followed by `_` (no space), the guard fires
 * and the entire sequence including the `_` is returned as plain text.
 *
 * This means that if the author intended italic text after the version token,
 * they must separate the token from the `_` with a space.
 *
 * Example:
 *   *v1.0_release notes_*  →  plain (limitation — italic suppressed)
 *   *2.5_italic text_*     →  plain (limitation — italic suppressed)
 *   *2.5 _italic text_*    →  italic preserved (space separates token from `_`)
 *
 * These tests document ACTUAL behavior. They are not marked `.skip`.
 * Do not change these assertions without also changing the grammar.
 */
describe('known limitation: unspaced italic after version-like tokens', () => {
	it('*v1.0_release notes_* — italic NOT rendered (guard fires for "v1.0_")', () => {
		// Guard matches: "v"=AlphaNum, "1"=AlphaNum, ".0"=[.\-]AlphaNum, "_"=[\x5F].
		// Returns plain("v1.0_"). Remaining "release notes_" ends in "_" but no
		// closing "_" follows within bold → no italic. All becomes plain.
		expect(parse('*v1.0_release notes_*', { emoticons: false })).toEqual([
			paragraph([bold([plain('v1.0_release notes_')])]),
		]);
	});

	it('*2.5_italic text_* — italic NOT rendered (guard fires for "2.5_")', () => {
		// Guard matches: "2"=AlphaNum, ".5"=[.\-]AlphaNum, "_"=[\x5F].
		// Returns plain("2.5_"). Remaining plain text.
		expect(parse('*2.5_italic text_*', { emoticons: false })).toEqual([
			paragraph([bold([plain('2.5_italic text_')])]),
		]);
	});

	it('*2.5 _italic text_* — italic IS rendered (space before _ bypasses guard)', () => {
		// BoldPlainRun consumes "2.5 " (space included; stops at "_").
		// Cursor at "_italic text_": guard fails (cursor is "_", not AlphaNumericChar).
		// Alt 5 fires → italic preserved.
		expect(parse('*2.5 _italic text_*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					plain('2.5 '),
					italic([plain('italic text')]),
				]),
			]),
		]);
	});
});
