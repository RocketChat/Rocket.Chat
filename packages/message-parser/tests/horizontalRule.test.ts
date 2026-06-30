import { parse } from '../src';
import { bold, horizontalRule, paragraph, plain } from './helpers';

// `fallback` is the [start, end] offset span of the marker run in the source
test.each([
	['---', [0, 3] as [number, number]],
	['***', [0, 3] as [number, number]],
	['___', [0, 3] as [number, number]],
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
