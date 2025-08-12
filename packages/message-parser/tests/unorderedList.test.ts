import { parse } from '../src';
import { unorderedList, plain, listItem, bold, emoji } from '../src/utils';

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
      unorderedList([
        listItem([plain('Second item')]),
        listItem([plain('Third item')]),
        listItem([bold([plain('Fourth item')])]),
      ]),
    ],
  ],
  //   [
  //     `
  // * First item
  // * Second item
  // * Third item
  //     * Indented item
  //     * Indented item
  // * Fourth item
  // `.trim(),
  //     [paragraph([])],
  //   ],
  //   [
  //     `
  // - First item
  // - Second item
  // - Third item
  //     - Indented item
  //     - Indented item
  // - Fourth item
  // `.trim(),
  //     [paragraph([])],
  //   ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
