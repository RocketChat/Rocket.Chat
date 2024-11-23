import { parse } from '../src';
import {
  heading,
  lineBreak,
  mentionChannel,
  paragraph,
  plain,
} from '../src/utils';

test.each([
  ['# h1', [heading([plain('h1')], 1)]],
  ['# Hello', [heading([plain('Hello')], 1)]],
  ['# Rocket.Cat', [heading([plain('Rocket.Cat')], 1)]],
  ['# Hi', [heading([plain('Hi')], 1)]],
  ['# Hello this is dog', [heading([plain('Hello this is dog')], 1)]],
  ['# Rocket cat says Hello', [heading([plain('Rocket cat says Hello')], 1)]],
  ['# He said Hello to her', [heading([plain('He said Hello to her')], 1)]],
  ['#Hello', [paragraph([mentionChannel('Hello')])]],
  ['#Hello#', [paragraph([mentionChannel('Hello'), plain('#')])]],
  ['He#llo', [paragraph([plain('He#llo')])]],

  ['## Hello', [heading([plain('Hello')], 2)]],
  ['## Rocket.Cat', [heading([plain('Rocket.Cat')], 2)]],
  ['## Hi', [heading([plain('Hi')], 2)]],
  ['## Hello this is dog', [heading([plain('Hello this is dog')], 2)]],
  ['## Rocket cat says Hello', [heading([plain('Rocket cat says Hello')], 2)]],
  ['## He said Hello to her', [heading([plain('He said Hello to her')], 2)]],
  ['##Hello', [paragraph([plain('##Hello')])]],
  ['##Hello##', [paragraph([plain('##Hello##')])]],
  ['He##llo', [paragraph([plain('He##llo')])]],

  ['### Hello', [heading([plain('Hello')], 3)]],
  ['### Rocket.Cat', [heading([plain('Rocket.Cat')], 3)]],
  ['### Hi', [heading([plain('Hi')], 3)]],
  ['### Hello this is dog', [heading([plain('Hello this is dog')], 3)]],
  ['### Rocket cat says Hello', [heading([plain('Rocket cat says Hello')], 3)]],
  ['### He said Hello to her', [heading([plain('He said Hello to her')], 3)]],
  ['###Hello', [paragraph([plain('###Hello')])]],
  ['###Hello###', [paragraph([plain('###Hello###')])]],
  ['He###llo', [paragraph([plain('He###llo')])]],

  ['#### Hello', [heading([plain('Hello')], 4)]],
  ['#### Rocket.Cat', [heading([plain('Rocket.Cat')], 4)]],
  ['#### Hi', [heading([plain('Hi')], 4)]],
  ['#### Hello this is dog', [heading([plain('Hello this is dog')], 4)]],
  [
    '#### Rocket cat says Hello',
    [heading([plain('Rocket cat says Hello')], 4)],
  ],
  ['#### He said Hello to her', [heading([plain('He said Hello to her')], 4)]],
  ['####Hello', [paragraph([plain('####Hello')])]],
  ['####Hello####', [paragraph([plain('####Hello####')])]],
  ['He####llo', [paragraph([plain('He####llo')])]],
  ['# Hello\n', [heading([plain('Hello')], 1), lineBreak()]],
  ['# # Hello\n', [heading([plain('# Hello')], 1), lineBreak()]],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
