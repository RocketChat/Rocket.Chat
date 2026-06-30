import { parse } from '../src';
import { bold, horizontalRule, paragraph, plain } from './helpers';

test.each([
	['---', [horizontalRule()]],
	['***', [horizontalRule()]],
	['___', [horizontalRule()]],
	['----------', [horizontalRule()]],
	['   ---   ', [horizontalRule()]],
])('parses %p as a horizontal rule', (input, output) => {
	expect(parse(input)).toEqual(output);
});

test('parses a horizontal rule between paragraphs', () => {
	expect(parse('above\n---\nbelow')).toEqual([paragraph([plain('above')]), horizontalRule(), paragraph([plain('below')])]);
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
