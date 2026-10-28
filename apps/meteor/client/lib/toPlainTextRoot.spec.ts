import { parse } from '@rocket.chat/message-parser';

import { toPlainTextRoot } from './toPlainTextRoot';

const paragraph = (value: string) => ({ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value }] });
const lineBreak = { type: 'LINE_BREAK', value: undefined };

describe('toPlainTextRoot', () => {
	it('should return an empty root for an empty string', () => {
		expect(toPlainTextRoot('')).toEqual([]);
	});

	it('should wrap a single line into a paragraph', () => {
		expect(toPlainTextRoot('hello')).toEqual([paragraph('hello')]);
	});

	it('should emit one paragraph per line', () => {
		expect(toPlainTextRoot('line one\nline two')).toEqual([paragraph('line one'), paragraph('line two')]);
	});

	it('should emit a line break for a blank line', () => {
		expect(toPlainTextRoot('line one\n\nline three')).toEqual([paragraph('line one'), lineBreak, paragraph('line three')]);
	});

	it('should emit consecutive line breaks for consecutive blank lines', () => {
		expect(toPlainTextRoot('a\n\n\nb')).toEqual([paragraph('a'), lineBreak, lineBreak, paragraph('b')]);
	});

	it('should keep markdown syntax as literal text', () => {
		expect(toPlainTextRoot('**bold** and _italic_')).toEqual([paragraph('**bold** and _italic_')]);
	});

	it('should keep mentions and emojis as literal text', () => {
		expect(toPlainTextRoot('hey @rocket.cat :smile:')).toEqual([paragraph('hey @rocket.cat :smile:')]);
	});

	describe('line ending normalization', () => {
		it('should normalize CRLF line endings', () => {
			expect(toPlainTextRoot('line one\r\nline two')).toEqual([paragraph('line one'), paragraph('line two')]);
		});

		it('should normalize lone CR line endings', () => {
			expect(toPlainTextRoot('line one\rline two')).toEqual([paragraph('line one'), paragraph('line two')]);
		});
	});

	describe('trailing line breaks', () => {
		it('should ignore a single trailing line break', () => {
			expect(toPlainTextRoot('hello\n')).toEqual([paragraph('hello')]);
		});

		it('should keep a blank line before a trailing line break', () => {
			expect(toPlainTextRoot('hello\n\n')).toEqual([paragraph('hello'), lineBreak]);
		});

		it('should keep a leading blank line', () => {
			expect(toPlainTextRoot('\nhello')).toEqual([lineBreak, paragraph('hello')]);
		});
	});

	// The whole point of the fallback is to render like the parser minus the markup, so for text that
	// carries no syntax both must produce the same tree. If one of these ever fails, the parser is the
	// source of truth and this helper is what should change.
	describe('parity with the parser', () => {
		it.each([['single line'], ['line one\nline two'], ['line one\n\nline three'], ['line one\n']])(
			'should match the parser output for %j',
			(text) => {
				expect(toPlainTextRoot(text)).toEqual(parse(text));
			},
		);
	});
});
