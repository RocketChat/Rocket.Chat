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
 *   After:  value:$(AlphaNumericChar MarkChar* (AlphaNumericChar MarkChar* / [.] AlphaNumericChar / [\-] DecimalNumberChar)* [\x5F] [\x5F]?)
 *             { return plain(value); }
 *
 * The fix extends the intra-word underscore guard from ASCII-only [a-zA-Z0-9]
 * to any Unicode letter/digit (AlphaNumericChar), optionally followed by
 * combining marks (MarkChar*), and tightens separator matching:
 *   - `.` separator: followed by any AlphaNumericChar (letter or digit)
 *   - `-` separator: followed ONLY by a decimal digit (DecimalNumberChar),
 *     so hyphenated words like `foo-bar` do NOT suppress italic.
 *
 * PR review fixes applied (see Sections G–I):
 *   - Finding 1: `foo-bar_italic_` now correctly produces italic (hyphen+letter
 *     is not a version separator).
 *   - Finding 2: `cafe\u0301_1.2_x` now correctly treats all underscores as
 *     plain (combining acute accent is a MarkChar, consumed after the base `e`).
 *   - Finding 3: `*_ОЛ_1.2_2_00_ЭС_*` produces italic(ОЛ)+plain(rest) —
 *     correct behavior; not a grammar bug.
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

// ---------------------------------------------------------------------------
// Section G: PR review finding 1 — hyphen+letter must NOT suppress italic
// ---------------------------------------------------------------------------

/**
 * PR review Finding 1 (Cubic AI):
 *
 * The previous guard `AlphaNumericChar (AlphaNumericChar / [.\-] AlphaNumericChar)*`
 * treated `-` as a universal version separator, so `foo-bar_italic_` suppressed
 * the `_italic_` italic span.
 *
 * Fix: narrow the `-` alternative to `[\-] DecimalNumberChar`. Hyphen is now
 * only a version separator when followed by a decimal digit (e.g. `v2-3`),
 * not when followed by a letter (e.g. `foo-bar`).
 *
 * Trace for `foo-bar_italic_`:
 *   Guard: "f"=AlphaNum, "oo"=AlphaNum. Next: "-b" — [\-] requires
 *   DecimalNumberChar after it; "b" is a letter, not a digit. FAILS.
 *   ()*  stops at "foo". After "foo", next char is "-", not "_". Guard FAILS.
 *   BoldPlainRun takes "foo-bar" (stops at "_"). "_italic_" → italic. ✓
 *
 * Trace for *v2-3_4_5* (must remain plain — existing test in Section A):
 *   Guard: "v"=AlphaNum, "2"=AlphaNum, "-3"=[\-]DecimalNum ✓, "_"=[\x5F] ✓.
 *   Guard fires → plain("v2-3_"). Then "4_" → plain. All plain. ✓
 */
describe('PR review finding 1 — hyphen+letter must not suppress italic', () => {
	it('*foo-bar_italic_* — guard does NOT fire; _italic_ is italic', () => {
		// Before fix: guard matched "foo-bar_" (hyphen was universal separator)
		// and produced plain("foo-bar_italic_"). After fix: guard stops at "foo"
		// because "-b" fails [\-]DecimalNumberChar. BoldPlainRun takes "foo-bar";
		// "_italic_" becomes italic.
		expect(parse('*foo-bar_italic_*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					plain('foo-bar'),
					italic([plain('italic')]),
				]),
			]),
		]);
	});

	it('*foo-bar_text here_* — guard does NOT fire; _text here_ is italic', () => {
		// Same reasoning: hyphen+letter ("b") is not a version separator.
		// BoldPlainRun takes "foo-bar"; "_text here_" → italic.
		expect(parse('*foo-bar_text here_*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					plain('foo-bar'),
					italic([plain('text here')]),
				]),
			]),
		]);
	});

	it('*v2-3_4_5* — guard still fires (hyphen+digit is a version separator)', () => {
		// "-3" = [\-]DecimalNumberChar ✓. Guard fires for "v2-3_".
		// All underscores become plain. This is the existing Section A behavior.
		expect(parse('*v2-3_4_5*', { emoticons: false })).toEqual([
			paragraph([bold([plain('v2-3_4_5')])]),
		]);
	});

	it('*step1-2_note* — guard fires (digit follows hyphen)', () => {
		// "step1" = AlphaNum+. "-2" = [\-]DecimalNum ✓. "_" = [\x5F] ✓.
		// Guard fires → plain("step1-2_note").
		expect(parse('*step1-2_note*', { emoticons: false })).toEqual([
			paragraph([bold([plain('step1-2_note')])]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section H: PR review finding 2 — combining marks (U+0301 and similar)
// ---------------------------------------------------------------------------

/**
 * PR review Finding 2 (CodeRabbit):
 *
 * Input `*cafe\u0301_1.2_2_00_x*` — the U+0301 COMBINING ACUTE ACCENT
 * follows the base character `e` to form `é` in NFD normalization. AlphaChar
 * does not include combining marks (Unicode category Mn), so the original
 * guard stopped at "cafe" and `_1.2_` became italic.
 *
 * Fix: add `MarkChar*` after each `AlphaNumericChar` position in the guard.
 * MarkChar covers all standard Unicode combining mark ranges including
 * \u0300-\u036F (Latin combining diacritics). Zero-or-more allows ordinary
 * letters (without combining marks) to match as before.
 *
 * Trace for `cafe\u0301_1.2_2_00_x`:
 *   "c"=AlphaNum, MarkChar*=0, "a"=AlphaNum, MarkChar*=0,
 *   "f"=AlphaNum, MarkChar*=0, "e"=AlphaNum, MarkChar*=U+0301 ✓.
 *   "_"=[\x5F] ✓. Guard fires → plain("cafe\u0301_").
 *   "1.2_": "1"=AlphaNum, ".2"=[.]AlphaNum ✓, "_" ✓ → plain("1.2_").
 *   "2_": plain. "00_": plain. "x": BoldPlainRun. All merged → plain. ✓
 *
 * Note: precomposed `é` (U+00E9) is in AlphaChar and always worked correctly.
 * This fix specifically addresses decomposed (NFD) representations.
 */
describe('PR review finding 2 — combining marks after alphanumeric', () => {
	it('*cafe\\u0301_1.2_2_00_x* — combining acute accent; all underscores plain', () => {
		// NFD form of "café": base "e" + U+0301. After fix, MarkChar* consumes
		// U+0301 as part of the leading alphanumeric cluster. Guard fires.
		expect(parse('*cafe\u0301_1.2_2_00_x*', { emoticons: false })).toEqual([
			paragraph([bold([plain('cafe\u0301_1.2_2_00_x')])]),
		]);
	});

	it('*caf\u00e9_1.2_2_00_x* — precomposed é (U+00E9) still works', () => {
		// U+00E9 is in AlphaChar; this case worked before and must still work.
		expect(parse('*caf\u00e9_1.2_2_00_x*', { emoticons: false })).toEqual([
			paragraph([bold([plain('caf\u00e9_1.2_2_00_x')])]),
		]);
	});

	it('*caf\u00e9_text_* — precomposed é immediately before underscore', () => {
		// Guard: "c","a","f"=AlphaNum, "\u00e9"=AlphaNum (in AlphaChar), "_" ✓.
		// Returns plain("café_text_").
		expect(parse('*caf\u00e9_text_*', { emoticons: false })).toEqual([
			paragraph([bold([plain('caf\u00e9_text_')])]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section I: PR review finding 3 — leading underscore in bold (documented)
// ---------------------------------------------------------------------------

/**
 * PR review Finding 3 (CodeRabbit):
 *
 * Input `*_ОЛ_1.2_2_00_ЭС_*` — reviewer noted "the underscore after ОЛ
 * is consumed as an italic delimiter."
 *
 * Investigation result: this IS correct grammar behavior, not a regression.
 *
 * Trace:
 *   - Cursor starts inside bold at "_".
 *   - Guard (Italic alt 1) requires AlphaNumericChar first. "_" fails. Guard FAILS.
 *   - Italic alt 5: `[\x5F] ItalicContent [\x5F]` tries "_ОЛ_". ItalicPlainRun
 *     matches "ОЛ" (stops at "_"). Close "_". Succeeds → italic("ОЛ").
 *   - Remaining "1.2_2_00_ЭС_*": guard fires for each segment → all plain.
 *   - Result: BOLD[italic("ОЛ"), plain("1.2_2_00_ЭС_")].
 *
 * The leading `_ОЛ_` is a valid italic span. The fix for issue #30595 does
 * not affect inputs that BEGIN with `_` inside bold — those always were and
 * remain italic. No grammar change is needed.
 *
 * This test documents ACTUAL behavior. The assertion reflects what the parser
 * produces, not an aspirational output.
 */
describe('PR review finding 3 — leading underscore in bold (correct behavior)', () => {
	it('*_ОЛ_1.2_2_00_ЭС_* — _ОЛ_ is italic; remaining underscores are plain', () => {
		// "_ОЛ_" is a valid italic span at the start of bold content.
		// The issue #30595 fix ensures "1.2_2_00_ЭС_" is all plain (guard fires
		// for each segment). This is correct and expected behavior.
		expect(parse('*_ОЛ_1.2_2_00_ЭС_*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					italic([plain('ОЛ')]),
					plain('1.2_2_00_ЭС_'),
				]),
			]),
		]);
	});

	it('*_italic_ word* — leading italic inside bold is preserved', () => {
		// Confirms the general case: leading _…_ inside bold → italic.
		// No regression from the #30595 fix.
		expect(parse('*_italic_ word*', { emoticons: false })).toEqual([
			paragraph([
				bold([
					italic([plain('italic')]),
					plain(' word'),
				]),
			]),
		]);
	});
});

// ---------------------------------------------------------------------------
// Section J: Edge case — combining mark after the character consumed by [.] AlphaNumericChar
// ---------------------------------------------------------------------------

/**
 * Edge case: combining mark immediately after the AlphaNumericChar consumed
 * by the dot-separator alternative.
 *
 * Input: *v1.e\u0301_2_00_x*
 *
 * The dot-separator alternative is `[.] AlphaNumericChar MarkChar*`.
 * Without `MarkChar*` after the AlphaNumericChar in that alternative,
 * U+0301 (following `e`) was not consumed by the guard. The loop stopped
 * at `v1.e`, next char was U+0301 (not `_`), guard failed. BoldPlainRun
 * took `v1.e\u0301`, then `_2_` fired as italic.
 *
 * Fix: add `MarkChar*` after `AlphaNumericChar` in the `[.] AlphaNumericChar`
 * alternative: `[.] AlphaNumericChar MarkChar*`. The hyphen alternative
 * (`[\-] DecimalNumberChar`) does not need this change — decimal digits are
 * not base characters for combining marks.
 *
 * Final Italic alt 1 expression:
 *   AlphaNumericChar MarkChar* (AlphaNumericChar MarkChar* / [.] AlphaNumericChar MarkChar* / [\-] DecimalNumberChar)* [\x5F] [\x5F]?
 *
 * Trace for `v1.e\u0301_2_00_x` with fix:
 *   `v`=AlphaNum, MarkChar*=0.
 *   `1`=AlphaNum, MarkChar*=0.
 *   `.e`=[.] AlphaNum ✓, MarkChar*=U+0301 ✓.
 *   `_`=[\x5F] ✓. Guard fires → plain("v1.e\u0301_").
 *   `2_` → plain. `00_` → plain. `x` → BoldPlainRun. All merged → plain. ✓
 */
describe('edge case J — combining mark after separator-consumed character', () => {
	it('*v1.e\\u0301_2_00_x* — combining mark after dot-separator alpha; all underscores plain', () => {
		// NFD "é" split as dot-separator target "e" + combining mark U+0301.
		// Guard must consume U+0301 via MarkChar* in the [.] AlphaNumericChar MarkChar* alternative.
		expect(parse('*v1.e\u0301_2_00_x*', { emoticons: false })).toEqual([
			paragraph([bold([plain('v1.e\u0301_2_00_x')])]),
		]);
	});

	it('*v1.e\u0301_text_* — combining mark after dot-separator; nested italic NOT suppressed incorrectly', () => {
		// Guard fires for "v1.e\u0301_", returning plain. Remaining "text_*":
		// "text" via BoldPlainRun, "_" via AnyBold (no closing "_"). All plain.
		expect(parse('*v1.e\u0301_text_*', { emoticons: false })).toEqual([
			paragraph([bold([plain('v1.e\u0301_text_')])]),
		]);
	});
});
