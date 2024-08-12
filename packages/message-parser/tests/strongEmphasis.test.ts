import { parse } from '../src';
import {
  bold,
  link,
  paragraph,
  plain,
  italic,
  strike,
  emoji,
  emojiUnicode,
  mentionChannel,
  mentionUser,
} from '../src/utils';

test.each([
  ['*:smile:*', [paragraph([bold([emoji('smile')])])]],
  [
    '*test :smile: test*',
    [paragraph([bold([plain('test '), emoji('smile'), plain(' test')])])],
  ],
  ['*😀*', [paragraph([bold([emojiUnicode('😀')])])]],
  ['*test 😀*', [paragraph([bold([plain('test '), emojiUnicode('😀')])])]],
  ['*@guilherme.gazzo*', [paragraph([bold([mentionUser('guilherme.gazzo')])])]],
  ['*#GENERAL*', [paragraph([bold([mentionChannel('GENERAL')])])]],
  [
    '*test @guilherme.gazzo*',
    [paragraph([bold([plain('test '), mentionUser('guilherme.gazzo')])])],
  ],
  [
    '*test #GENERAL*',
    [paragraph([bold([plain('test '), mentionChannel('GENERAL')])])],
  ],
  [
    '*[A brand new Gist](https://gist.github.com/24dddfa97bef58f46ac2ce0f80c58ba4)*',
    [
      paragraph([
        bold([
          link('https://gist.github.com/24dddfa97bef58f46ac2ce0f80c58ba4', [
            plain('A brand new Gist'),
          ]),
        ]),
      ]),
    ],
  ],
  ['**bold**', [paragraph([bold([plain('bold')])])]],
  ['** bold**', [paragraph([bold([plain(' bold')])])]],
  ['** bold **', [paragraph([bold([plain(' bold ')])])]],
  ['** bo ld **', [paragraph([bold([plain(' bo ld ')])])]],
  ['pre**bold**', [paragraph([plain('pre'), bold([plain('bold')])])]],
  ['**bold**pos', [paragraph([bold([plain('bold')]), plain('pos')])]],
  [
    '**bold****bold**',
    [paragraph([bold([plain('bold')]), bold([plain('bold')])])],
  ],
  [
    '**bold** **bold**',
    [paragraph([bold([plain('bold')]), plain(' '), bold([plain('bold')])])],
  ],
  [
    '**bold** __italic__',
    [paragraph([bold([plain('bold')]), plain(' '), italic([plain('italic')])])],
  ],
  ['**__italicbold__**', [paragraph([bold([italic([plain('italicbold')])])])]],
  [
    'plain **__italicbold__**',
    [paragraph([plain('plain '), bold([italic([plain('italicbold')])])])],
  ],
  [
    'plain **__~~strikeitalicbold~~__**',
    [
      paragraph([
        plain('plain '),
        bold([italic([strike([plain('strikeitalicbold')])])]),
      ]),
    ],
  ],
  ['**', [paragraph([plain('**')])]],
  ['* *', [paragraph([plain('* *')])]],
  ['** *', [paragraph([plain('** *')])]],
  ['** **', [paragraph([plain('** **')])]],
  ['**  **', [paragraph([plain('**  **')])]],
  ['* Hello*', [paragraph([bold([plain(' Hello')])])]],
  ['*Hello *', [paragraph([bold([plain('Hello ')])])]],
  [
    ':custom*emoji*case:',
    [paragraph([plain(':custom'), bold([plain('emoji')]), plain('case:')])],
  ],
  [
    'text*hello*text',
    [paragraph([plain('text'), bold([plain('hello')]), plain('text')])],
  ],
  ['*hello*text', [paragraph([bold([plain('hello')]), plain('text')])]],
  ['text*hello*', [paragraph([plain('text'), bold([plain('hello')])])]],
  ['*Hel lo*', [paragraph([bold([plain('Hel lo')])])]],
  ['*Hello*', [paragraph([bold([plain('Hello')])])]],
  ['**Hello*', [paragraph([plain('*'), bold([plain('Hello')])])]],
  ['*Hello**', [paragraph([bold([plain('Hello')]), plain('*')])]],
  ['*Hello', [paragraph([plain('*Hello')])]],
  ['Hello*', [paragraph([plain('Hello*')])]],
  ['He*llo', [paragraph([plain('He*llo')])]],
  [
    '***Hello***',
    [paragraph([plain('*'), bold([plain('Hello')]), plain('*')])],
  ],
  ['***Hello**', [paragraph([plain('*'), bold([plain('Hello')])])]],
  [
    '*Hello* this is dog',
    [paragraph([bold([plain('Hello')]), plain(' this is dog')])],
  ],
  [
    'Rocket cat says *Hello*',
    [paragraph([plain('Rocket cat says '), bold([plain('Hello')])])],
  ],
  [
    'He said *Hello* to her',
    [paragraph([plain('He said '), bold([plain('Hello')]), plain(' to her')])],
  ],
  [
    '**Hello** this is dog',
    [paragraph([bold([plain('Hello')]), plain(' this is dog')])],
  ],
  [
    'Rocket cat says **Hello**',
    [paragraph([plain('Rocket cat says '), bold([plain('Hello')])])],
  ],
  [
    'He said **Hello** to her',
    [paragraph([plain('He said '), bold([plain('Hello')]), plain(' to her')])],
  ],
  [
    'He was a**nn**oyed',
    [paragraph([plain('He was a'), bold([plain('nn')]), plain('oyed')])],
  ],
  [
    'There are two o in f*oo*tball',
    [
      paragraph([
        plain('There are two o in f'),
        bold([plain('oo')]),
        plain('tball'),
      ]),
    ],
  ],
  ['*(teste*', [paragraph([bold([plain('(teste')])])]],
  ['*(teste)*', [paragraph([bold([plain('(teste)')])])]],
  [
    '*__~bolditalicstrike~_*',
    [
      paragraph([
        bold([plain('_'), italic([strike([plain('bolditalicstrike')])])]),
      ]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
