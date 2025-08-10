import { parse } from '../src';
import { paragraph, plain, bold } from '../src/utils';

test.each([
  ['Hello *world*', [paragraph([plain('Hello '), bold([plain('world')])])]],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
