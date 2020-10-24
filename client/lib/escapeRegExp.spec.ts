import assert from 'assert';

import { describe, it } from 'mocha';

import { escapeRegExp } from './escapeRegExp';

describe('escapeRegExp', () => {
	it('should keep strings with letters only unchanged', () => {
		assert.equal(escapeRegExp('word'), 'word');
	});

	it('should escape slashes', () => {
		assert.equal(escapeRegExp('/slashes/'), '\\/slashes\\/');
		assert.equal(escapeRegExp('\\backslashes\\'), '\\\\backslashes\\\\');
		assert.equal(escapeRegExp('\\border of word'), '\\\\border of word');
	});

	it('should escape special group', () => {
		assert.equal(escapeRegExp('(?:non-capturing)'), '\\(\\?:non\\-capturing\\)');
		assert.equal(
			new RegExp(`${ escapeRegExp('(?:') }([^)]+)`).exec('(?:non-capturing)')?.[1],
			'non-capturing',
		);

		assert.equal(escapeRegExp('(?=positive-lookahead)'), '\\(\\?=positive\\-lookahead\\)');
		assert.equal(
			new RegExp(`${ escapeRegExp('(?=') }([^)]+)`).exec('(?=positive-lookahead)')?.[1],
			'positive-lookahead',
		);

		assert.equal(escapeRegExp('(?<=positive-lookbehind)'), '\\(\\?<=positive\\-lookbehind\\)');
		assert.equal(
			new RegExp(`${ escapeRegExp('(?<=') }([^)]+)`).exec('(?<=positive-lookbehind)')?.[1],
			'positive-lookbehind',
		);

		assert.equal(escapeRegExp('(?!negative-lookahead)'), '\\(\\?!negative\\-lookahead\\)');
		assert.equal(
			new RegExp(`${ escapeRegExp('(?!') }([^)]+)`).exec('(?!negative-lookahead)')?.[1],
			'negative-lookahead',
		);

		assert.equal(escapeRegExp('(?<!negative-lookbehind)'), '\\(\\?<!negative\\-lookbehind\\)');
		assert.equal(
			new RegExp(`${ escapeRegExp('(?<!') }([^)]+)`).exec('(?<!negative-lookbehind)')?.[1],
			'negative-lookbehind',
		);

		assert.equal(escapeRegExp('[\\w]+'), '\\[\\\\w\\]\\+');
		assert.equal(new RegExp(`${ escapeRegExp('[') }([^\\]]+)`).exec('[character class]')?.[1], 'character class');

		assert.equal(new RegExp(escapeRegExp('<div>')).exec('<td><div></td>')?.[0], '<div>');

		assert.equal(escapeRegExp('{5,2}'), '\\{5,2\\}');

		assert.equal(
			escapeRegExp('/([.*+?^=!:${}()|[\\]\\/\\\\])/g'),
			'\\/\\(\\[\\.\\*\\+\\?\\^=!:\\$\\{\\}\\(\\)\\|\\[\\\\\\]\\\\\\/\\\\\\\\\\]\\)\\/g',
		);
	});

	it('should not escape whitespace', () => {
		assert.equal(escapeRegExp('\\n\\r\\t'), '\\\\n\\\\r\\\\t');
		assert.equal(escapeRegExp('\n\r\t'), '\n\r\t');
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
