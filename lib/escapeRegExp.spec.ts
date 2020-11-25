import assert from 'assert';

import { describe, it } from 'mocha';

import { escapeRegExp } from './escapeRegExp';

describe('escapeRegExp', () => {
	it('should keep strings with letters only unchanged', () => {
		assert.strictEqual(escapeRegExp('word'), 'word');
	});

	it('should escape slashes', () => {
		assert.strictEqual(escapeRegExp('/slashes/'), '\\/slashes\\/');
		assert.strictEqual(escapeRegExp('\\backslashes\\'), '\\\\backslashes\\\\');
		assert.strictEqual(escapeRegExp('\\border of word'), '\\\\border of word');
	});

	it('should escape special group', () => {
		assert.strictEqual(escapeRegExp('(?:non-capturing)'), '\\(\\?:non\\-capturing\\)');
		assert.strictEqual(
			new RegExp(`${ escapeRegExp('(?:') }([^)]+)`).exec('(?:non-capturing)')?.[1],
			'non-capturing',
		);

		assert.strictEqual(escapeRegExp('(?=positive-lookahead)'), '\\(\\?=positive\\-lookahead\\)');
		assert.strictEqual(
			new RegExp(`${ escapeRegExp('(?=') }([^)]+)`).exec('(?=positive-lookahead)')?.[1],
			'positive-lookahead',
		);

		assert.strictEqual(escapeRegExp('(?<=positive-lookbehind)'), '\\(\\?<=positive\\-lookbehind\\)');
		assert.strictEqual(
			new RegExp(`${ escapeRegExp('(?<=') }([^)]+)`).exec('(?<=positive-lookbehind)')?.[1],
			'positive-lookbehind',
		);

		assert.strictEqual(escapeRegExp('(?!negative-lookahead)'), '\\(\\?!negative\\-lookahead\\)');
		assert.strictEqual(
			new RegExp(`${ escapeRegExp('(?!') }([^)]+)`).exec('(?!negative-lookahead)')?.[1],
			'negative-lookahead',
		);

		assert.strictEqual(escapeRegExp('(?<!negative-lookbehind)'), '\\(\\?<!negative\\-lookbehind\\)');
		assert.strictEqual(
			new RegExp(`${ escapeRegExp('(?<!') }([^)]+)`).exec('(?<!negative-lookbehind)')?.[1],
			'negative-lookbehind',
		);

		assert.strictEqual(escapeRegExp('[\\w]+'), '\\[\\\\w\\]\\+');
		assert.strictEqual(new RegExp(`${ escapeRegExp('[') }([^\\]]+)`).exec('[character class]')?.[1], 'character class');

		assert.strictEqual(new RegExp(escapeRegExp('<div>')).exec('<td><div></td>')?.[0], '<div>');

		assert.strictEqual(escapeRegExp('{5,2}'), '\\{5,2\\}');

		assert.strictEqual(
			escapeRegExp('/([.*+?^=!:${}()|[\\]\\/\\\\])/g'),
			'\\/\\(\\[\\.\\*\\+\\?\\^=!:\\$\\{\\}\\(\\)\\|\\[\\\\\\]\\\\\\/\\\\\\\\\\]\\)\\/g',
		);
	});

	it('should not escape whitespace', () => {
		assert.strictEqual(escapeRegExp('\\n\\r\\t'), '\\\\n\\\\r\\\\t');
		assert.strictEqual(escapeRegExp('\n\r\t'), '\n\r\t');
	});

	it('throws an error for non-string argument', () => {
		// @ts-ignore
		assert.throws(() => escapeRegExp(false));

		// @ts-ignore
		assert.throws(() => escapeRegExp());

		// @ts-ignore
		assert.throws(() => escapeRegExp(null));

		// @ts-ignore
		assert.throws(() => escapeRegExp(42));
	});
});
