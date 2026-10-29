import { getLineMarker, toggleLineMarker } from './toggleLineMarker';

describe('getLineMarker', () => {
	it.each(['*{{text}}*', '_{{text}}_', '~{{text}}~', '`{{text}}`'])('returns the marker of the inline pattern %s', (pattern) => {
		expect(getLineMarker(pattern)).toBe(pattern[0]);
	});

	it.each(['({{text}})', '"{{text}}"', "'{{text}}'", '[{{text}}]', '```\n{{text}}\n```'])('returns nothing for %j', (pattern) => {
		expect(getLineMarker(pattern)).toBeUndefined();
	});
});

describe('toggleLineMarker', () => {
	it('wraps each line on its own', () => {
		expect(toggleLineMarker('This is\na test', '*')).toBe('*This is*\n*a test*');
	});

	it('leaves blank lines alone', () => {
		expect(toggleLineMarker('123\n456\n\n789', '_')).toBe('_123_\n_456_\n\n_789_');
	});

	it('keeps the whitespace around a line outside the markers', () => {
		expect(toggleLineMarker('  indented \nnext', '~')).toBe('  ~indented~ \n~next~');
	});

	it('unwraps the lines when every line is already wrapped', () => {
		expect(toggleLineMarker('*This is*\n\n*a test*', '*')).toBe('This is\n\na test');
	});

	it.each(['\r', String.fromCharCode(0x2028)])('keeps a line that contains the separator %j', (separator) => {
		expect(toggleLineMarker(`foo${separator}bar\nbaz`, '*')).toBe(`*foo${separator}bar*\n*baz*`);
	});

	it('does not treat whitespace-only emphasis as formatted', () => {
		expect(toggleLineMarker('* *\nfoo', '*')).toBe('** **\n*foo*');
	});

	it('wraps every line when only some are wrapped', () => {
		expect(toggleLineMarker('*This is*\na test', '*')).toBe('**This is**\n*a test*');
	});
});
