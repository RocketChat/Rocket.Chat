import { parse } from '../src';
import { bold, plain, orderedList, listItem, emoji } from './helpers';

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
])('parses %p', (input, output) => {
	expect(parse(input)).toMatchObject(output);
});
