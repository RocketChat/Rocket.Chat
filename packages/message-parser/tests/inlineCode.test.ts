import { parse } from '../src';
import { inlineCode, paragraph, plain } from '../src/utils';

test.each([
  [
    '`[asd](https://localhost)`',
    [paragraph([inlineCode(plain('[asd](https://localhost)'))])],
  ],
  [`\`code\``, [paragraph([inlineCode(plain('code'))])]],
  [
    `File extension (\`.mov\`)`,
    [
      paragraph([
        plain('File extension ('),
        inlineCode(plain('.mov')),
        plain(')'),
      ]),
    ],
  ],
  ['`@rocket.chat`', [paragraph([inlineCode(plain('@rocket.chat'))])]],
  [
    '`@rocket.chat/message-parser`',
    [paragraph([inlineCode(plain('@rocket.chat/message-parser'))])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
