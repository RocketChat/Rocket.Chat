import { parse } from '../src';
import { link, paragraph, plain, bold } from '../src/utils';

test.each([
  [
    '+07563546725',
    [paragraph([link('tel:07563546725', [plain('+07563546725')])])],
  ],
  [
    '+075-63546725',
    [paragraph([link('tel:07563546725', [plain('+075-63546725')])])],
  ],
  [
    '+(075)-63546725',
    [paragraph([link('tel:07563546725', [plain('+(075)-63546725')])])],
  ],
  [
    '+(075)63546725',
    [paragraph([link('tel:07563546725', [plain('+(075)63546725')])])],
  ],
  [
    '[here](+(075)63546725)',
    [paragraph([link('tel:07563546725', [plain('here')])])],
  ],
  [
    '[**here**](+(075)63546725)',
    [paragraph([link('tel:07563546725', [bold([plain('here')])])])],
  ],
  [
    '[**here**](+(075)63546725)',
    [paragraph([link('tel:07563546725', [bold([plain('here')])])])],
  ],
  [
    '+(11)99999-9999',
    [paragraph([link('tel:11999999999', [plain('+(11)99999-9999')])])],
  ],
  [
    '5 +51231',
    [paragraph([plain('5 '), link('tel:51231', [plain('+51231')])])],
  ],
  [
    '5 +51231 5',
    [
      paragraph([
        plain('5 '),
        link('tel:51231', [plain('+51231')]),
        plain(' 5'),
      ]),
    ],
  ],
  ['+(12)3-45', [paragraph([link('tel:12345', [plain('+(12)3-45')])])]],
  ['+1.599123', [paragraph([plain('+1.599123')])]],
  ['1+1=2', [paragraph([plain('1+1=2')])]],
  ['1+1=2 text', [paragraph([plain('1+1=2 text')])]],
  ['+1000,00', [paragraph([plain('+1000,00')])]],
  ['+ 1199999999', [paragraph([plain('+ 1199999999')])]],
  ['+1234', [paragraph([plain('+1234')])]],
  ['+(12)3-4', [paragraph([plain('+(12)3-4')])]],
  ['+123-4', [paragraph([plain('+123-4')])]],
  ['5+51231', [paragraph([plain('5+51231')])]],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
