import { parse } from '../src';
import { bold, horizontalRule, paragraph, plain } from './helpers';

// Only dashes form a horizontal rule; `fallback` is the [start, end] offset span of the run.
test.each([
	['---', [0, 3] as [number, number]],
	['----------', [0, 10] as [number, number]],
	['   ---   ', [3, 6] as [number, number]],
])('parses %p as a horizontal rule', (input, range) => {
	expect(parse(input)).toEqual([horizontalRule(range)]);
	// the offsets slice back to the markers
	expect(input.slice(range[0], range[1])).toBe(input.trim());
});

test('parses a horizontal rule between paragraphs', () => {
	expect(parse('above\n---\nbelow')).toEqual([paragraph([plain('above')]), horizontalRule([6, 9]), paragraph([plain('below')])]);
});

// `*` and `_` are NOT horizontal rules: they collide with emphasis and with censored
// words (bad-words masks a term as a run of `*`), so a bare `***` / `_______` / `*******`
// line must stay text/emphasis rather than becoming a divider.
test.each(['***', '___', '*******', '_______'])('does not treat %p as a horizontal rule', (input) => {
	const [node] = parse(input);
	expect(node.type).not.toBe('HORIZONTAL_RULE');
});

test.each([
	// fewer than three markers -> plain text
	['--', [paragraph([plain('--')])]],
	['**', [paragraph([plain('**')])]],
	// emphasis must not be swallowed by the rule (parsed as a paragraph, not a rule)
	['***bold italic***', [paragraph([plain('*'), bold([plain('bold italic')]), plain('*')])]],
	// spaced markers are whitespace-emphasis (plain), not a rule
	['** **', [paragraph([plain('** **')])]],
	// list item, not a rule
	['- item', [{ type: 'UNORDERED_LIST', value: [{ type: 'LIST_ITEM', value: [plain('item')] }] }]],
])('does not treat %p as a horizontal rule', (input, output) => {
	expect(parse(input)).toEqual(output);
});
