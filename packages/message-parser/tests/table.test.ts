import { parse } from '../src';
import { bold, link, plain, table, tableCell, tableRow } from './helpers';

// `fallback` is the [start, end] offset span of the table in the source; since
// each input is exactly the table, that span is [0, input.length].
test.each([
	// basic table, no alignment
	[
		`
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`.trim(),
		[tableCell([plain('Header 1')]), tableCell([plain('Header 2')])],
		[tableRow([tableCell([plain('Cell 1')]), tableCell([plain('Cell 2')])])],
	],
	// alignment markers
	[
		`
| Left | Center | Right |
| :--- | :----: | ----: |
| a    | b      | c     |
`.trim(),
		[tableCell([plain('Left')], 'left'), tableCell([plain('Center')], 'center'), tableCell([plain('Right')], 'right')],
		[tableRow([tableCell([plain('a')], 'left'), tableCell([plain('b')], 'center'), tableCell([plain('c')], 'right')])],
	],
	// multiple body rows
	[
		`
| h |
| - |
| 1 |
| 2 |
`.trim(),
		[tableCell([plain('h')])],
		[tableRow([tableCell([plain('1')])]), tableRow([tableCell([plain('2')])])],
	],
	// header only (no body rows)
	[
		`
| a | b |
| - | - |
`.trim(),
		[tableCell([plain('a')]), tableCell([plain('b')])],
		[],
	],
	// inline markup inside cells
	[
		`
| Name | Link |
| ---- | ---- |
| **bold** | [rc](https://rocket.chat) |
`.trim(),
		[tableCell([plain('Name')]), tableCell([plain('Link')])],
		[tableRow([tableCell([bold([plain('bold')])]), tableCell([link('https://rocket.chat', [plain('rc')])])])],
	],
	// escaped pipe inside a cell stays literal
	[
		`
| a | b |
| - | - |
| x \\| y | z |
`.trim(),
		[tableCell([plain('a')]), tableCell([plain('b')])],
		[tableRow([tableCell([plain('x | y')]), tableCell([plain('z')])])],
	],
])('parses %p', (input, header, rows) => {
	expect(parse(input)).toEqual([table(header, rows, [0, input.length])]);
});

test('normalizes ragged body rows to the header column count', () => {
	const input = ['| a | b |', '| - | - |', '| 1 |', '| 1 | 2 | 3 |'].join('\n');
	const [node] = parse(input) as [ReturnType<typeof table>];

	// every row has exactly 2 cells (header count): short row padded, long row truncated
	expect(node.value.rows.map((row) => row.value.length)).toEqual([2, 2]);
	expect(node.value.rows[0].value[1].value).toEqual([]); // padded empty cell
	expect(node.value.rows[1].value.map((c) => c.value)).toEqual([[plain('1')], [plain('2')]]); // extra 3rd cell dropped
});

test('exposes the source offsets as fallback for renderers without table support', () => {
	const input = '| a | b |\n| - | - |\n| 1 | 2 |';
	const [node] = parse(input) as [ReturnType<typeof table>];
	expect(node.fallback).toEqual([0, input.length]);
	// the offsets slice back to the original markup
	expect(input.slice(node.fallback![0], node.fallback![1])).toBe(input);
});

test.each([
	// no delimiter row -> not a table, plain paragraph
	['| just | text |', [{ type: 'PARAGRAPH', value: [plain('| just | text |')] }]],
	// missing trailing pipe -> not a table (v1 requires surrounding pipes)
	[
		`
| a | b
| - | -
`.trim(),
		[
			{ type: 'PARAGRAPH', value: [plain('| a | b')] },
			{ type: 'PARAGRAPH', value: [plain('| - | -')] },
		],
	],
])('does not parse %p as table', (input, output) => {
	expect(parse(input)).toEqual(output);
});
