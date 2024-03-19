import { parse } from '../src';
import { paragraph, plain, quote, bold } from '../src/utils';

test.each([
  [
    `
As Rocket Cat said:
> meowww
> grr.
`.trim(),
    [
      paragraph([plain('As Rocket Cat said:')]),
      quote([paragraph([plain('meowww')]), paragraph([plain('grr.')])]),
    ],
  ],
  [
    `
As Rocket Cat said:
> *meowww*
> grr.
`.trim(),
    [
      paragraph([plain('As Rocket Cat said:')]),
      quote([paragraph([bold([plain('meowww')])]), paragraph([plain('grr.')])]),
    ],
  ],
  [
    `
As Rocket Cat said:
>meowww
>grr.
`.trim(),
    [
      paragraph([plain('As Rocket Cat said:')]),
      quote([paragraph([plain('meowww')]), paragraph([plain('grr.')])]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
