import { parse } from '../src';
import { paragraph, plain, bold, italic, emoticon } from '../src/utils';

test.each([
  ['*test:*', [paragraph([bold([plain('test:')])])]],
  ['_test:_', [paragraph([italic([plain('test:')])])]],
  [
    // :* is an emoticon, but it shouldn't be parsed as one if its glued to a word
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
    [
      paragraph([
        bold([
          plain('bold with a kissing emoji '),
          emoticon(':*', 'kissing_heart'),
          plain(' '),
        ]),
      ]),
    ],
  ],
  [
    '*bold with a broken kissing emoji:**',
    [
      paragraph([
        bold([plain('bold with a broken kissing emoji:')]),
        plain('*'),
      ]),
    ],
  ],
  [
    '*bold with a broken kissing emoji:*:*',
    [
      paragraph([
        bold([plain('bold with a broken kissing emoji:')]),
        emoticon(':*', 'kissing_heart'),
      ]),
    ],
  ],
  [
    '*bold with a broken kissing emoji :*text *',
    [
      paragraph([
        bold([plain('bold with a broken kissing emoji :')]),
        plain('text *'),
      ]),
    ],
  ],
  [
    '*broken bold with a kissing emoji :*',
    [
      paragraph([
        plain('*broken bold with a kissing emoji '),
        emoticon(':*', 'kissing_heart'),
      ]),
    ],
  ],
  [
    '*broken bold with a kissing emoji :* ',
    [
      paragraph([
        plain('*broken bold with a kissing emoji '),
        emoticon(':*', 'kissing_heart'),
        plain(' '),
      ]),
    ],
  ],
  [
    '*two bolds**second*',
    [paragraph([bold([plain('two bolds')]), bold([plain('second')])])],
  ],
  [
    '*two bolds*:**separated by kissing emoji*',
    [
      paragraph([
        bold([plain('two bolds')]),
        emoticon(':*', 'kissing_heart'),
        bold([plain('separated by kissing emoji')]),
      ]),
    ],
  ],
  ['_test-_-', [paragraph([italic([plain('test-')]), plain('-')])]],
  [
    '_test -_- _',
    [
      paragraph([
        italic([plain('test '), emoticon('-_-', 'expressionless'), plain(' ')]),
      ]),
    ],
  ],
  [
    '_test -_-_',
    [paragraph([italic([plain('test '), emoticon('-_-', 'expressionless')])])],
  ],
  [
    '_two italics__second_',
    [paragraph([italic([plain('two italics')]), italic([plain('second')])])],
  ],
  [
    '_italic with broken emoticon-_-_',
    [paragraph([italic([plain('italic with broken emoticon-')]), plain('-_')])],
  ],
  [
    '_italic with broken emoticon-_-_ and more text',
    [
      paragraph([
        italic([plain('italic with broken emoticon-')]),
        plain('-_ and more text'),
      ]),
    ],
  ],
  [
    '_italic with broken emoticon -_-and more text',
    [
      paragraph([
        italic([plain('italic with broken emoticon -')]),
        plain('-and more text'),
      ]),
    ],
  ],
  [
    '_italic with broken emoticon -_-and more text -_-',
    [
      paragraph([
        italic([plain('italic with broken emoticon -')]),
        plain('-and more text '),
        emoticon('-_-', 'expressionless'),
      ]),
    ],
  ],
  [
    '_italic with broken emoticon -_-and more text -_-_',
    [
      paragraph([
        italic([plain('italic with broken emoticon -')]),
        plain('-and more text -'),
        italic([plain('-')]),
      ]),
    ],
  ],
  [
    '-_-italic content-_-',
    [paragraph([plain('-'), italic([plain('-italic content-')]), plain('-')])],
  ],
])('parses emphasisWithEmoticons %p', (input, output) => {
  expect(parse(input, { emoticons: true })).toMatchObject(output);
});
