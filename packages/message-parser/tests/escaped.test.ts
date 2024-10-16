import { parse } from '../src';
import { paragraph, plain, bold } from '../src/utils';

test.each([
  ['¯\\\\_(ツ)_/¯', [paragraph([plain('¯\\_(ツ)_/¯')])]],
  [
    '\\*escaped as*bold*escaped*',
    [
      paragraph([
        plain('*escaped as'),
        bold([plain('bold')]),
        plain('escaped*'),
      ]),
    ],
  ],
  ['\\*not bold*', [paragraph([plain('*not bold*')])]],
  ['*_~`#.'.split('').join('\\'), [paragraph([plain('*_~`#.')])]],
  ['\\*not emphasized*', [paragraph([plain('*not emphasized*')])]],
  ['\\<br/> tag plain text', [paragraph([plain('\\<br/> tag plain text')])]],
  [
    '\\[it is not a link](/foo)',
    [paragraph([plain('\\[it is not a link](/foo)')])],
  ],
  ['\\`not code`', [paragraph([plain('`not code`')])]],
  ['1\\. not a list', [paragraph([plain('1. not a list')])]],
  ['\\* not a list', [paragraph([plain('* not a list')])]],
  ['\\# not a heading', [paragraph([plain('# not a heading')])]],
  [
    '\\[foo]: /url "not a reference"',
    [paragraph([plain('\\[foo]: /url "not a reference"')])],
  ],
  [
    '\\&ouml; not a character entity',
    [paragraph([plain('\\&ouml; not a character entity')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
