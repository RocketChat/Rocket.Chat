import { parse } from '../src';
import {
  bold,
  paragraph,
  plain,
  strike,
  timestamp,
  timestampFromHours,
} from '../src/utils';

test.each([
  [`<t:1708551317>`, [paragraph([timestamp('1708551317')])]],
  [`<t:1708551317:R>`, [paragraph([timestamp('1708551317', 'R')])]],
  [
    'hello <t:1708551317>',
    [paragraph([plain('hello '), timestamp('1708551317')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});

test.each([
  ['<t:1708551317:I>', [paragraph([plain('<t:1708551317:I>')])]],
  ['<t:17>', [paragraph([plain('<t:17>')])]],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});

test.each([
  ['~<t:1708551317>~', [paragraph([strike([timestamp('1708551317')])])]],
  ['*<t:1708551317>*', [paragraph([bold([plain('<t:1708551317>')])])]],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});

test.each([
  [
    '<t:2025-07-22T10:00:00.000Z:R>',
    [paragraph([timestamp('1753178400000', 'R')])],
  ],
  [
    '<t:2025-07-22T10:00:00.000Z:R>',
    [paragraph([timestamp('1753178400000', 'R')])],
  ],
  [
    '<t:2025-07-22T10:00:00.000:R>',
    [paragraph([timestamp('1753178400000', 'R')])],
  ],
  ['<t:2025-07-22T10:00:00:R>', [paragraph([timestamp('1753178400000', 'R')])]],
  [
    '<t:10:00:00:R>',
    [paragraph([timestamp(timestampFromHours('10', '00', '00'), 'R')])],
  ],
  [
    '<t:10:00:R>',
    [paragraph([timestamp(timestampFromHours('10', '00', '00'), 'R')])],
  ],
  [
    '<t:10:00:00>',
    [paragraph([timestamp(timestampFromHours('10', '00', '00'), 't')])],
  ],
  [
    '<t:10:00>',
    [paragraph([timestamp(timestampFromHours('10', '00', '00'), 't')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
