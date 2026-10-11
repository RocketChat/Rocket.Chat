import { parse } from '../src';
import { bold, plain, orderedList, listItem, emoji, unorderedList } from './helpers';

test.each([
	[
		`
0. Zeroth item
7. First item
2. Second item
8. Third item
4. *Fourth item*
15. *Fifteenth item*
20. :smile:
`.trim(),
		[
			orderedList([
				listItem([plain('Zeroth item')], 0),
				listItem([plain('First item')], 7),
				listItem([plain('Second item')], 2),
				listItem([plain('Third item')], 8),
				listItem([bold([plain('Fourth item')])], 4),
				listItem([bold([plain('Fifteenth item')])], 15),
				listItem([emoji('smile')], 20),
			]),
		],
	],
	[
		`
1. First item
2. Second item
   1. Nested item
   2. Nested item
3. Third item
`.trim(),
		[
			orderedList([
				listItem([plain('First item')], 1),
				listItem([plain('Second item')], 2, [
					listItem([plain('Nested item')], 1),
					listItem([plain('Nested item')], 2),
				]),
				listItem([plain('Third item')], 3),
			]),
		],
	],
	[
		`
1. Parent
   - Nested unordered
   - Another
2. Sibling
`.trim(),
		[
			orderedList([
				listItem([plain('Parent')], 1, [listItem([plain('Nested unordered')]), listItem([plain('Another')])]),
				listItem([plain('Sibling')], 2),
			]),
		],
	],
	[
		`
1. Ordered
- Unordered sibling
`.trim(),
		[orderedList([listItem([plain('Ordered')], 1)]), unorderedList([listItem([plain('Unordered sibling')])])],
	],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
