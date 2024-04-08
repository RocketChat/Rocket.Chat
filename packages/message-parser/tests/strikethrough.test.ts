import { parse } from '../src';
import {
  emoji,
  emojiUnicode,
  link,
  mentionChannel,
  mentionUser,
  paragraph,
  plain,
  strike,
} from '../src/utils';

test.each([
  ['~:smile:~', [paragraph([strike([emoji('smile')])])]],
  [
    '~test :smile: test~',
    [paragraph([strike([plain('test '), emoji('smile'), plain(' test')])])],
  ],
  ['~😀~', [paragraph([strike([emojiUnicode('😀')])])]],
  ['~test 😀~', [paragraph([strike([plain('test '), emojiUnicode('😀')])])]],
  [
    '~@guilherme.gazzo~',
    [paragraph([strike([mentionUser('guilherme.gazzo')])])],
  ],
  ['~#GENERAL~', [paragraph([strike([mentionChannel('GENERAL')])])]],
  [
    '~test @guilherme.gazzo~',
    [paragraph([strike([plain('test '), mentionUser('guilherme.gazzo')])])],
  ],
  [
    '~test #GENERAL~',
    [paragraph([strike([plain('test '), mentionChannel('GENERAL')])])],
  ],
  [
    '~~[A brand new Gist](https://gist.github.com/24dddfa97bef58f46ac2ce0f80c58ba4)~~',
    [
      paragraph([
        strike([
          link('https://gist.github.com/24dddfa97bef58f46ac2ce0f80c58ba4', [
            plain('A brand new Gist'),
          ]),
        ]),
      ]),
    ],
  ],
  ['~~strike~~', [paragraph([strike([plain('strike')])])]],
  [
    'pre~~strike~~post',
    [paragraph([plain('pre'), strike([plain('strike')]), plain('post')])],
  ],
  [
    ' pre~~strike~~post ',
    [paragraph([plain(' pre'), strike([plain('strike')]), plain('post ')])],
  ],
  ['~~', [paragraph([plain('~~')])]],
  ['~ ~', [paragraph([plain('~ ~')])]],
  ['~~ ~', [paragraph([plain('~~ ~')])]],
  ['~~ ~~', [paragraph([plain('~~ ~~')])]],
  ['~ Hello~', [paragraph([strike([plain(' Hello')])])]],
  ['~Hello ~', [paragraph([strike([plain('Hello ')])])]],
  [
    ':custom~emoji~case:',
    [paragraph([plain(`:custom`), strike([plain('emoji')]), plain(`case:`)])],
  ],
  [
    'text~hello~text',
    [paragraph([plain(`text`), strike([plain('hello')]), plain(`text`)])],
  ],
  ['~hello~text', [paragraph([strike([plain('hello')]), plain(`text`)])]],
  ['text~hello~', [paragraph([plain(`text`), strike([plain('hello')])])]],
  ['~Hel lo~', [paragraph([strike([plain('Hel lo')])])]],
  ['~Hello~', [paragraph([strike([plain('Hello')])])]],
  ['~~Hello~~', [paragraph([strike([plain('Hello')])])]],
  ['~~Hello~', [paragraph([plain(`~`), strike([plain('Hello')])])]],
  ['~Hello~~', [paragraph([strike([plain('Hello')]), plain(`~`)])]],
  ['~Hello', [paragraph([plain('~Hello')])]],
  ['Hello~', [paragraph([plain('Hello~')])]],
  ['He~llo', [paragraph([plain('He~llo')])]],
  [
    '~~~Hello~~~',
    [paragraph([plain(`~`), strike([plain('Hello')]), plain(`~`)])],
  ],
  ['~~~Hello~~', [paragraph([plain(`~`), strike([plain('Hello')])])]],
  [
    '~Hello~ this is dog',
    [paragraph([strike([plain('Hello')]), plain(` this is dog`)])],
  ],
  [
    'Rocket cat says ~Hello~',
    [paragraph([plain(`Rocket cat says `), strike([plain('Hello')])])],
  ],
  [
    'He said ~Hello~ to her',
    [
      paragraph([
        plain(`He said `),
        strike([plain('Hello')]),
        plain(` to her`),
      ]),
    ],
  ],
  [
    '~~Hello~~ this is dog',
    [paragraph([strike([plain('Hello')]), plain(` this is dog`)])],
  ],
  [
    'Rocket cat says ~~Hello~~',
    [paragraph([plain(`Rocket cat says `), strike([plain('Hello')])])],
  ],
  [
    'He said ~~Hello~~ to her',
    [
      paragraph([
        plain(`He said `),
        strike([plain('Hello')]),
        plain(` to her`),
      ]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
