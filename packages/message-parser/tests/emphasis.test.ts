import { parse } from '../src';
import {
  italic,
  paragraph,
  plain,
  strike,
  bold,
  emoji,
  link,
  bigEmoji,
  emojiUnicode,
  mentionChannel,
  mentionUser,
  inlineCode,
} from '../src/utils';

test.each([
  ['_:smile:_', [paragraph([italic([emoji('smile')])])]],
  ['_:slight_smile:_', [paragraph([italic([emoji('slight_smile')])])]],
  [
    '_test :smile: test_',
    [paragraph([italic([plain('test '), emoji('smile'), plain(' test')])])],
  ],
  [
    '_test :slight_smile: test_',
    [
      paragraph([
        italic([plain('test '), emoji('slight_smile'), plain(' test')]),
      ]),
    ],
  ],
  ['_😀_', [paragraph([italic([emojiUnicode('😀')])])]],
  ['_test 😀_', [paragraph([italic([plain('test '), emojiUnicode('😀')])])]],
  [
    '_test @guilherme.gazzo test_',
    [
      paragraph([
        italic([
          plain('test '),
          mentionUser('guilherme.gazzo'),
          plain(' test'),
        ]),
      ]),
    ],
  ],
  [
    '_test #GENERAL test_',
    [
      paragraph([
        italic([plain('test '), mentionChannel('GENERAL'), plain(' test')]),
      ]),
    ],
  ],
  [
    '_[A brand new Gist](https://gist.github.com/24dddfa97bef58f46ac2ce0f80c58ba4)_',
    [
      paragraph([
        italic([
          link('https://gist.github.com/24dddfa97bef58f46ac2ce0f80c58ba4', [
            plain('A brand new Gist'),
          ]),
        ]),
      ]),
    ],
  ],
  ['__italic__', [paragraph([italic([plain('italic')])])]],
  ['__italic__non', [paragraph([plain('__italic__non')])]],
  ['__test__test__', [paragraph([plain('__test__test__')])]],
  ['pre__italic__post', [paragraph([plain('pre__italic__post')])]],
  [' pre__italic__post', [paragraph([plain(' pre__italic__post')])]],
  [
    ' pre__**~~boldstrikeitalic~~**__post ',
    [
      paragraph([
        plain(' pre__'),
        bold([strike([plain('boldstrikeitalic')])]),
        plain('__post '),
      ]),
    ],
  ],
  ['__', [paragraph([plain('__')])]],
  ['_ _', [paragraph([plain('_ _')])]],
  ['__ _', [paragraph([plain('__ _')])]],
  ['__ __', [paragraph([plain('__ __')])]],
  ['_ Hello_', [paragraph([italic([plain(' Hello')])])]],
  ['_Hello _', [paragraph([italic([plain('Hello ')])])]],
  [':custom_emoji_case:', [bigEmoji([emoji('custom_emoji_case')])]],
  ['_Hel lo_', [paragraph([italic([plain('Hel lo')])])]],
  ['_Hello_', [paragraph([italic([plain('Hello')])])]],
  ['__Hello__', [paragraph([italic([plain('Hello')])])]],
  ['__Hello_', [paragraph([plain('_'), italic([plain('Hello')])])]],
  ['_Hello__', [paragraph([italic([plain('Hello')]), plain('_')])]],
  ['_Hello', [paragraph([plain('_Hello')])]],
  ['Hello_', [paragraph([plain('Hello_')])]],
  ['He_llo', [paragraph([plain('He_llo')])]],
  [
    '___Hello___',
    [paragraph([plain('_'), italic([plain('Hello')]), plain('_')])],
  ],
  ['___Hello__', [paragraph([plain('_'), italic([plain('Hello')])])]],
  [
    '_Hello_ this is dog',
    [paragraph([italic([plain('Hello')]), plain(` this is dog`)])],
  ],
  [
    'Rocket cat says _Hello_',
    [paragraph([plain(`Rocket cat says `), italic([plain('Hello')])])],
  ],
  [
    'He said _Hello_ to her',
    [
      paragraph([
        plain(`He said `),
        italic([plain('Hello')]),
        plain(` to her`),
      ]),
    ],
  ],
  [
    '__Hello__ this is dog',
    [paragraph([italic([plain('Hello')]), plain(` this is dog`)])],
  ],
  [
    'Rocket cat says __Hello__',
    [paragraph([plain(`Rocket cat says `), italic([plain('Hello')])])],
  ],
  [
    'He said __Hello__ to her',
    [
      paragraph([
        plain(`He said `),
        italic([plain('Hello')]),
        plain(` to her`),
      ]),
    ],
  ],
  ['text_hello_text', [paragraph([plain('text_hello_text')])]],
  ['_hello_text', [paragraph([plain('_hello_text')])]],
  ['text_hello_', [paragraph([plain('text_hello_')])]],
  ['_italic@test_', [paragraph([italic([plain('italic@test')])])]],
  ['_italic#test_', [paragraph([italic([plain('italic#test')])])]],
  ['paragraph@test__', [paragraph([plain('paragraph@test__')])]],
  [
    '_ @guilherme_gazzo_ _',
    [
      paragraph([
        italic([plain(' '), mentionUser('guilherme_gazzo_'), plain(' ')]),
      ]),
    ],
  ],
  [
    '_ @guilherme.gazzo _',
    [
      paragraph([
        italic([plain(' '), mentionUser('guilherme.gazzo'), plain(' ')]),
      ]),
    ],
  ],
  [
    '**reference link inside [emphasis with more [references](https://rocket.chat)](https://rocket.chat)**',
    [
      paragraph([
        bold([
          plain('reference link inside '),
          link('https://rocket.chat', [
            plain('emphasis with more [references'),
          ]),
          plain('](https://rocket.chat)'),
        ]),
      ]),
    ],
  ],
  ['_ouch_ouch', [paragraph([plain('_ouch_ouch')])]],
  [
    `_@mention _gone`,
    [paragraph([plain('_'), mentionUser('mention'), plain(' _gone')])],
  ],
  [
    '_nothing `should` be _gone',
    [
      paragraph([
        plain('_nothing '),
        inlineCode(plain('should')),
        plain(' be _gone'),
      ]),
    ],
  ],
  [
    '**bold ~~and strike~~** **not bold ~~but strike** ~~ not strike~~',
    [
      paragraph([
        bold([plain('bold '), strike([plain('and strike')])]),
        plain(' **not bold '),
        strike([plain('but strike** ')]),
        plain(' not strike~~'),
      ]),
    ],
  ],
  [
    '**bold** **another bold** ~~strike~~ ~~another strike~~ **bold ~~and strike~~** **not bold ~~but strike** ~~ not strike~~',
    [
      paragraph([
        bold([plain('bold')]),
        plain(' '),
        bold([plain('another bold')]),
        plain(' '),
        strike([plain('strike')]),
        plain(' '),
        strike([plain('another strike')]),
        plain(' '),
        bold([plain('bold '), strike([plain('and strike')])]),
        plain(' **not bold '),
        strike([plain('but strike** ')]),
        plain(' not strike~~'),
      ]),
    ],
  ],
  [
    'some_snake_case_text and even_more',
    [paragraph([plain('some_snake_case_text and even_more')])],
  ],
  [
    'some_snake_case_text and some __italic__ text',
    [
      paragraph([
        plain('some_snake_case_text and some '),
        italic([plain('italic')]),
        plain(' text'),
      ]),
    ],
  ],
  [
    'some__double__snake__case__text and even_more',
    [paragraph([plain('some__double__snake__case__text and even_more')])],
  ],
  [
    'some__double__snake__case__text and some __italic__ text',
    [
      paragraph([
        plain('some__double__snake__case__text and some '),
        italic([plain('italic')]),
        plain(' text'),
      ]),
    ],
  ],
  [
    'something__ __and italic__',
    [paragraph([plain('something__ '), italic([plain('and italic')])])],
  ],
  ['*test:*', [paragraph([bold([plain('test:')])])]],
  [
    '*bold ending with colon:*',
    [paragraph([bold([plain('bold ending with colon:')])])],
  ],
  [
    '*bold ending with colon:* and some more text',
    [
      paragraph([
        bold([plain('bold ending with colon:')]),
        plain(' and some more text'),
      ]),
    ],
  ],
  [
    '*bold ending with colon :*and some more text',
    [
      paragraph([
        bold([plain('bold ending with colon :')]),
        plain('and some more text'),
      ]),
    ],
  ],
  [
    '*bold with a kissing emoji :* *',
    [paragraph([bold([plain('bold with a kissing emoji :')]), plain(' *')])],
  ],
  [
    '*bold with a kissing emoji :* ',
    [paragraph([bold([plain('bold with a kissing emoji :')]), plain(' ')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input, { emoticons: false })).toMatchObject(output);
});
