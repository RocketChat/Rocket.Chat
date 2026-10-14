import { parse } from '../src';
import { unorderedList, plain, listItem, bold, emoji, paragraph } from './helpers';

test.each([
	[
		`
- First item
- Second item
- Third item
- *Fourth item*
- :smile:
`.trim(),
		[
			unorderedList([
				listItem([plain('First item')]),
				listItem([plain('Second item')]),
				listItem([plain('Third item')]),
				listItem([bold([plain('Fourth item')])]),
				listItem([emoji('smile')]),
			]),
		],
	],
	[
		`
* First item
* Second item
* Third item
* *Fourth item*
`.trim(),
		[
			unorderedList([
				listItem([plain('First item')]),
				listItem([plain('Second item')]),
				listItem([plain('Third item')]),
				listItem([bold([plain('Fourth item')])]),
			]),
		],
	],
	[
		`
- First item
* Second item
* Third item
* *Fourth item*
`.trim(),
		[
			unorderedList([listItem([plain('First item')])]),
			unorderedList([listItem([plain('Second item')]), listItem([plain('Third item')]), listItem([bold([plain('Fourth item')])])]),
		],
	],
	[
		`
* First item
* Second item
* Third item
    * Indented item
    * Indented item
* Fourth item
`.trim(),
		[
			unorderedList([listItem([plain('First item')]), listItem([plain('Second item')]), listItem([plain('Third item')])]),
			paragraph([plain('    * Indented item')]),
			paragraph([plain('    * Indented item')]),
			unorderedList([listItem([plain('Fourth item')])]),
		],
	],
	[
		`
- First item
- Second item
- Third item
    - Indented item
    - Indented item
- Fourth item
`.trim(),
		[
			unorderedList([listItem([plain('First item')]), listItem([plain('Second item')]), listItem([plain('Third item')])]),
			paragraph([plain('    - Indented item')]),
			paragraph([plain('    - Indented item')]),
			unorderedList([listItem([plain('Fourth item')])]),
		],
	],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
