import { parse } from '../src';
import { bold, listItem, orderedList, paragraph, plain, task, tasks, unorderedList } from './helpers';

test.each([
	[
		`
* Item 1
    * Nested Item 1
    * Nested Item 2
    * Nested Item 3
`.trim(),
		[
			unorderedList([
				listItem([plain('Item 1')], undefined, [
					unorderedList([listItem([plain('Nested Item 1')]), listItem([plain('Nested Item 2')]), listItem([plain('Nested Item 3')])]),
				]),
			]),
		],
	],
	[
		`
- First
  - Second
    - Third
  - Back to second
- Back to first
`.trim(),
		[
			unorderedList([
				listItem([plain('First')], undefined, [
					unorderedList([
						listItem([plain('Second')], undefined, [unorderedList([listItem([plain('Third')])])]),
						listItem([plain('Back to second')]),
					]),
				]),
				listItem([plain('Back to first')]),
			]),
		],
	],
	[
		`
1. Step one
   - detail *a*
   - detail b
2. Step two
	1. tab indented
`.trim(),
		[
			orderedList([
				listItem([plain('Step one')], 1, [
					unorderedList([listItem([plain('detail '), bold([plain('a')])]), listItem([plain('detail b')])]),
				]),
				listItem([plain('Step two')], 2, [orderedList([listItem([plain('tab indented')], 1)])]),
			]),
		],
	],
	[
		`
- [ ] parent task
  - [x] child task
  - child item
`.trim(),
		[
			tasks([
				task([plain('parent task')], false, [tasks([task([plain('child task')], true)]), unorderedList([listItem([plain('child item')])])]),
			]),
		],
	],
	[
		`
- Item
  not a list line
`.trim(),
		[unorderedList([listItem([plain('Item')])]), paragraph([plain('  not a list line')])],
	],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
