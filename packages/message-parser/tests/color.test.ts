import { parse } from '../src';
import { color, paragraph, plain } from '../src/utils';

test.each([
  [
    'color:#ccc',
    [paragraph([color(0xcc, 0xcc, 0xcc)])],
    [paragraph([plain('color:#ccc')])],
  ],
  [
    'color:#cccc',
    [paragraph([color(0xcc, 0xcc, 0xcc, 0xcc)])],
    [paragraph([plain('color:#cccc')])],
  ],
  [
    'color:#c7c7c7',
    [paragraph([color(0xc7, 0xc7, 0xc7)])],
    [paragraph([plain('color:#c7c7c7')])],
  ],
  [
    'color:#c7c7c7c7',
    [paragraph([color(0xc7, 0xc7, 0xc7, 0xc7)])],
    [paragraph([plain('color:#c7c7c7c7')])],
  ],
  ['color:#c7c7c7c7c7', [paragraph([plain('color:#c7c7c7c7c7')])], undefined],
  ['color:#c7', [paragraph([plain('color:#c7')])], undefined],
  ['color:#zzz', [paragraph([plain('color:#zzz')])], undefined],
])('parses %p', (input, output, disabledOutput) => {
  expect(parse(input, { colors: true })).toMatchObject(output);

  if (disabledOutput) {
    expect(parse(input, { colors: false })).toMatchObject(disabledOutput);
  }
});
