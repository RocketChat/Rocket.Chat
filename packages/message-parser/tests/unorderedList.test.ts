import { parse } from '../src';
import { unorderedList, plain, listItem, bold, emoji, orderedList } from './helpers';

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
			unorderedList([
				listItem([plain('First item')]),
				listItem([plain('Second item')]),
				listItem([plain('Third item')], undefined, [
					listItem([plain('Indented item')]),
					listItem([plain('Indented item')]),
				]),
				listItem([plain('Fourth item')]),
			]),
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
			unorderedList([
				listItem([plain('First item')]),
				listItem([plain('Second item')]),
				listItem([plain('Third item')], undefined, [
					listItem([plain('Indented item')]),
					listItem([plain('Indented item')]),
				]),
				listItem([plain('Fourth item')]),
			]),
		],
	],
	[
		`
- Level 1
  - Level 2
    - Level 3
`.trim(),
		[
			unorderedList([
				listItem([plain('Level 1')], undefined, [
					listItem([plain('Level 2')], undefined, [listItem([plain('Level 3')])]),
				]),
			]),
		],
	],
	[
		`
- Parent
  1. Nested ordered
  2. Another nested
- Sibling
`.trim(),
		[
			unorderedList([
				listItem([plain('Parent')], undefined, [
					listItem([plain('Nested ordered')], 1),
					listItem([plain('Another nested')], 2),
				]),
				listItem([plain('Sibling')]),
			]),
		],
	],
	[
		`
- Unordered
1. Ordered sibling
`.trim(),
		[unorderedList([listItem([plain('Unordered')])]), orderedList([listItem([plain('Ordered sibling')], 1)])],
	],
	[
		`
- Parent
  1. Ordered child
  - Unordered child
`.trim(),
		[
			unorderedList([
				listItem([plain('Parent')], undefined, [
					listItem([plain('Ordered child')], 1),
					listItem([plain('Unordered child')]),
				]),
			]),
		],
	],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});

