import { parse } from '../src';
import {
  bold,
  inlineCode,
  italic,
  paragraph,
  plain,
  strike,
} from '../src/utils';

test.each([
  [
    '~~`Striking Inline Code`~~',
    [paragraph([strike([inlineCode(plain('Striking Inline Code'))])])],
  ],
  [
    '~~_`Striking Inline Code with Italics`_~~',
    [
      paragraph([
        strike([
          italic([inlineCode(plain('Striking Inline Code with Italics'))]),
        ]),
      ]),
    ],
  ],
  [
    '~~**`Striking Inline Code with Bold`**~~',
    [
      paragraph([
        strike([bold([inlineCode(plain('Striking Inline Code with Bold'))])]),
      ]),
    ],
  ],
  [
    '~~__*`Striking Inline Code with Bold`*__~~',
    [
      paragraph([
        strike([
          italic([bold([inlineCode(plain('Striking Inline Code with Bold'))])]),
        ]),
      ]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
