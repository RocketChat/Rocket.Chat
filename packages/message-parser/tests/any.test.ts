import { parse } from '../src';
import { paragraph, plain } from '../src/utils';

test.each([
  ['free text', [paragraph([plain('free text')])]],
  ['free text, with comma', [paragraph([plain('free text, with comma')])]],
  [
    'free text with unxpected/unfinished blocks *bold_',
    [paragraph([plain('free text with unxpected/unfinished blocks *bold_')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
