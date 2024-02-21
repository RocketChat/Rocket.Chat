import { parse } from '../src';
import { bold, paragraph, plain, strike, timestamp } from '../src/utils';

test.each([
  [`<t:1708551317642>`, [paragraph([timestamp('1708551317642')])]],
  [`<t:1708551317642:R>`, [paragraph([timestamp('1708551317642', 'R')])]],
  [
    'hello <t:1708551317642>',
    [paragraph([plain('hello '), timestamp('1708551317642')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});

test.each([
  ['<t:1708551317642:I>', [paragraph([plain('<t:1708551317642:I>')])]],
  ['<t:17>', [paragraph([plain('<t:17>')])]],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});

test.each([
  ['~<t:1708551317642>~', [paragraph([strike([timestamp('1708551317642')])])]],
  ['*<t:1708551317642>*', [paragraph([bold([plain('<t:1708551317642>')])])]],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
