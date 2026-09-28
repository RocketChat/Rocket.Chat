import { escapeRegExp } from './escapeRegExp';

describe('escapeRegExp', () => {
	it('should keep strings with letters only unchanged', () => {
		expect(escapeRegExp('word')).toBe('word');
	});

	it('should escape slashes', () => {
		expect(escapeRegExp('/slashes/')).toBe('\\/slashes\\/');
		expect(escapeRegExp('\\backslashes\\')).toBe('\\\\backslashes\\\\');
		expect(escapeRegExp('\\border of word')).toBe('\\\\border of word');
	});

	it('should escape special group', () => {
		expect(escapeRegExp('(?:non-capturing)')).toBe('\\(\\?\\:non\\-capturing\\)');
		expect(new RegExp(`${escapeRegExp('(?:')}([^)]+)`).exec('(?:non-capturing)')?.[1]).toBe('non-capturing');

		expect(escapeRegExp('(?=positive-lookahead)')).toBe('\\(\\?\\=positive\\-lookahead\\)');
		expect(new RegExp(`${escapeRegExp('(?=')}([^)]+)`).exec('(?=positive-lookahead)')?.[1]).toBe('positive-lookahead');

		expect(escapeRegExp('(?<=positive-lookbehind)')).toBe('\\(\\?<\\=positive\\-lookbehind\\)');
		expect(new RegExp(`${escapeRegExp('(?<=')}([^)]+)`).exec('(?<=positive-lookbehind)')?.[1]).toBe('positive-lookbehind');

		expect(escapeRegExp('(?!negative-lookahead)')).toBe('\\(\\?\\!negative\\-lookahead\\)');
		expect(new RegExp(`${escapeRegExp('(?!')}([^)]+)`).exec('(?!negative-lookahead)')?.[1]).toBe('negative-lookahead');

		expect(escapeRegExp('(?<!negative-lookbehind)')).toBe('\\(\\?<\\!negative\\-lookbehind\\)');
		expect(new RegExp(`${escapeRegExp('(?<!')}([^)]+)`).exec('(?<!negative-lookbehind)')?.[1]).toBe('negative-lookbehind');

		expect(escapeRegExp('[\\w]+')).toBe('\\[\\\\w\\]\\+');
		expect(new RegExp(`${escapeRegExp('[')}([^\\]]+)`).exec('[character class]')?.[1]).toBe('character class');

		expect(new RegExp(escapeRegExp('<div>')).exec('<td><div></td>')?.[0]).toBe('<div>');

		expect(escapeRegExp('{5,2}')).toBe('\\{5,2\\}');

		expect(escapeRegExp('/([.*+?^=!:${}()|[\\]\\/\\\\])/g')).toBe(
			'\\/\\(\\[\\.\\*\\+\\?\\^\\=\\!\\:\\$\\{\\}\\(\\)\\|\\[\\\\\\]\\\\\\/\\\\\\\\\\]\\)\\/g',
		);
	});

	it('should not escape whitespace', () => {
		expect(escapeRegExp('\\n\\r\\t')).toBe('\\\\n\\\\r\\\\t');
		expect(escapeRegExp('\n\r\t')).toBe('\n\r\t');
	});

	it('ignores errors from non-string argument', () => {
		expect(() => escapeRegExp(false as any)).not.toThrow();

		expect(() => (escapeRegExp as any)()).not.toThrow();

		expect(() => escapeRegExp(null as any)).not.toThrow();

		expect(() => escapeRegExp(42 as any)).not.toThrow();
	});
});
