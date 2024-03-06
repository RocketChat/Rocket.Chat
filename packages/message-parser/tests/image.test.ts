import { parse } from '../src';
import { image, paragraph, plain } from '../src/utils';

test.each([
  [
    '![image](https://rocket.chat/assets/img/header/logo.svg)',
    [
      paragraph([
        image('https://rocket.chat/assets/img/header/logo.svg', plain('image')),
      ]),
    ],
  ],
  [
    '![](https://rocket.chat/assets/img/header/logo.svg)',
    [paragraph([image('https://rocket.chat/assets/img/header/logo.svg')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
