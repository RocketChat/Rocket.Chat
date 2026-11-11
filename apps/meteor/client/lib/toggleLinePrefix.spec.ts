import { ORDERED_LINE_PREFIX, UNORDERED_LINE_PREFIX, applyLinePrefix, bareLinePrefixRange, continueLinePrefix } from './toggleLinePrefix';

const at = (start: number, end = start) => ({ start, end });

describe('applyLinePrefix', () => {
	describe('unordered', () => {
		it('prefixes the line the caret sits on', () => {
			expect(applyLinePrefix('one', at(1), UNORDERED_LINE_PREFIX)).toEqual({ value: '- one', blockStart: 0, blockEnd: 3 });
		});

		it('prefixes every line the selection touches', () => {
			const text = 'one\ntwo\nthree';

			expect(applyLinePrefix(text, at(1, 9), UNORDERED_LINE_PREFIX).value).toBe('- one\n- two\n- three');
		});

		it('leaves lines outside the selection alone', () => {
			const text = 'one\ntwo\nthree';
			const { value, blockStart, blockEnd } = applyLinePrefix(text, at(4, 5), UNORDERED_LINE_PREFIX);

			expect(value).toBe('- two');
			expect(text.slice(0, blockStart) + value + text.slice(blockEnd)).toBe('one\n- two\nthree');
		});

		it('strips the marker when every touched line already has one', () => {
			const text = '- one\n- two';

			expect(applyLinePrefix(text, at(0, text.length), UNORDERED_LINE_PREFIX).value).toBe('one\ntwo');
		});

		it('prefixes the whole block when only some lines have a marker', () => {
			const text = '- one\ntwo';

			expect(applyLinePrefix(text, at(0, text.length), UNORDERED_LINE_PREFIX).value).toBe('- one\n- two');
		});

		it('inserts a marker on an empty composer', () => {
			expect(applyLinePrefix('', at(0), UNORDERED_LINE_PREFIX)).toEqual({ value: '- ', blockStart: 0, blockEnd: 0 });
		});

		it('skips blank lines inside the selection', () => {
			const text = 'one\n\ntwo';

			expect(applyLinePrefix(text, at(0, text.length), UNORDERED_LINE_PREFIX).value).toBe('- one\n\n- two');
		});

		it('removes an asterisk marker, which the parser accepts but cannot round-trip', () => {
			const text = '*  one';

			expect(applyLinePrefix(text, at(0, text.length), UNORDERED_LINE_PREFIX).value).toBe('one');
		});

		it('does not treat a task as a bullet', () => {
			const text = '- [x] done';

			expect(applyLinePrefix(text, at(0, text.length), UNORDERED_LINE_PREFIX).value).toBe('- - [x] done');
		});
	});

	describe('ordered', () => {
		it('numbers each line from one', () => {
			const text = 'one\ntwo\nthree';

			expect(applyLinePrefix(text, at(0, text.length), ORDERED_LINE_PREFIX).value).toBe('1. one\n2. two\n3. three');
		});

		it('strips the marker when every touched line already has one', () => {
			const text = '1. one\n2. two';

			expect(applyLinePrefix(text, at(0, text.length), ORDERED_LINE_PREFIX).value).toBe('one\ntwo');
		});

		it('strips markers even when the user numbered them out of order', () => {
			const text = '1. one\n3. three\n2. two';

			expect(applyLinePrefix(text, at(0, text.length), ORDERED_LINE_PREFIX).value).toBe('one\nthree\ntwo');
		});

		it('does not count blank lines towards the numbering', () => {
			const text = 'one\n\ntwo';

			expect(applyLinePrefix(text, at(0, text.length), ORDERED_LINE_PREFIX).value).toBe('1. one\n\n2. two');
		});

		it('removes a leading-zero marker, which the parser accepts but cannot round-trip', () => {
			const text = '01. one';

			expect(applyLinePrefix(text, at(0, text.length), ORDERED_LINE_PREFIX).value).toBe('one');
		});
	});

	describe('converting between the two', () => {
		it('replaces bullets with numbers instead of stacking markers', () => {
			const text = '- one\n- two';

			expect(applyLinePrefix(text, at(0, text.length), ORDERED_LINE_PREFIX).value).toBe('1. one\n2. two');
		});

		it('replaces numbers with bullets instead of stacking markers', () => {
			const text = '1. one\n2. two';

			expect(applyLinePrefix(text, at(0, text.length), UNORDERED_LINE_PREFIX).value).toBe('- one\n- two');
		});

		it('rewrites markers the parser cannot round-trip into ones it can', () => {
			const text = '*  one\n01. two';

			expect(applyLinePrefix(text, at(0, text.length), ORDERED_LINE_PREFIX).value).toBe('1. one\n2. two');
		});

		it('unifies a mixed block under the requested marker', () => {
			const text = '- one\n2. two';

			expect(applyLinePrefix(text, at(0, text.length), UNORDERED_LINE_PREFIX).value).toBe('- one\n- two');
		});
	});

	describe('block boundaries', () => {
		it.each([
			['caret at the very start', 0, 0, 0, 3],
			['caret at the end of the first line', 3, 3, 0, 3],
			['caret at the start of the second line', 4, 4, 4, 7],
			['caret at the end of the text', 13, 13, 8, 13],
		])('resolves %s to the enclosing lines', (_label, start, end, blockStart, blockEnd) => {
			expect(applyLinePrefix('one\ntwo\nthree', at(start, end), UNORDERED_LINE_PREFIX)).toMatchObject({
				blockStart,
				blockEnd,
			});
		});
	});
});

describe('continueLinePrefix', () => {
	it.each([
		['a bullet', '- one', '- '],
		['an asterisk bullet', '* one', '- '],
		['a bullet holding only the marker', '- ', '- '],
		['the first number', '1. one', '2. '],
		['a later number', '9. nine', '10. '],
		['a number the user typed out of order', '7. seven', '8. '],
		['a number with no content', '3. ', '4. '],
	])('continues %s', (_label, text, expected) => {
		expect(continueLinePrefix(text, text.length)).toBe(expected);
	});

	it.each([
		['plain text', 'hello'],
		['an empty composer', ''],
		['a task', '- [x] done'],
		['an unchecked task', '- [ ] todo'],
		['a hyphen with no trailing space', '-'],
		['a number with no trailing space', '1.'],
		['bold markup at the start of the line', '*bold* text'],
	])('does not continue %s', (_label, text) => {
		expect(continueLinePrefix(text, text.length)).toBeUndefined();
	});

	it('reads the line the caret sits on, not the first line', () => {
		const text = 'intro\n- one';

		expect(continueLinePrefix(text, text.length)).toBe('- ');
	});

	it('continues the list when the caret is mid-line', () => {
		expect(continueLinePrefix('- one', 4)).toBe('- ');
	});

	it('does not continue when the caret sits before the marker', () => {
		expect(continueLinePrefix('- one', 1)).toBeUndefined();
	});

	it('does not carry a list on the line above into a plain line', () => {
		const text = '- one\nplain';

		expect(continueLinePrefix(text, text.length)).toBeUndefined();
	});
});

describe('bareLinePrefixRange', () => {
	it.each([
		['a bare bullet', '- ', 2, { start: 0, end: 2 }],
		['a bare number', '3. ', 3, { start: 0, end: 3 }],
		['a bare bullet with padded spacing', '-   ', 4, { start: 0, end: 4 }],
		['a bare bullet on a later line', '- one\n- ', 8, { start: 6, end: 8 }],
		['a bare number on a later line', '1. one\n2. ', 10, { start: 7, end: 10 }],
		['a bare bullet with text on the next line', '- \nafter', 2, { start: 0, end: 2 }],
	])('reports %s', (_label, text, caret, expected) => {
		expect(bareLinePrefixRange(text, caret)).toEqual(expected);
	});

	it.each([
		['a bullet holding content', '- one', 5],
		['a number holding content', '1. one', 6],
		['plain text', 'hello', 5],
		['an empty composer', '', 0],
		['a task', '- [x] done', 10],
		['a hyphen with no trailing space', '-', 1],
		['a bare bullet with the caret before the marker', '- ', 0],
		['a bare bullet with the caret inside the marker', '- ', 1],
	])('does not report %s', (_label, text, caret) => {
		expect(bareLinePrefixRange(text, caret)).toBeUndefined();
	});

	it('does not report a marker whose content sits after the caret', () => {
		expect(bareLinePrefixRange('- text', 2)).toBeUndefined();
	});
});
