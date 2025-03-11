import { parse } from '../src';
import { bigEmoji, paragraph, plain, emoticon } from '../src/utils';

test.each([
  // Should render normal Emojis
  [
    `test
     :) test`,
    [
      paragraph([plain('test')]),
      paragraph([
        plain('     '),
        emoticon(':)', 'slight_smile'),
        plain(' test'),
      ]),
    ],
  ],
  [':) asd', [paragraph([emoticon(':)', 'slight_smile'), plain(' asd')])]],
  [
    ' :) asd',
    [paragraph([plain(' '), emoticon(':)', 'slight_smile'), plain(' asd')])],
  ],
  ['Hi :)', [paragraph([plain('Hi '), emoticon(':)', 'slight_smile')])]],
  [
    'asdas :) asd',
    [
      paragraph([
        plain('asdas '),
        emoticon(':)', 'slight_smile'),
        plain(' asd'),
      ]),
    ],
  ],
  [
    ':) :) :) :)',
    [
      paragraph([
        emoticon(':)', 'slight_smile'),
        plain(' '),
        emoticon(':)', 'slight_smile'),
        plain(' '),
        emoticon(':)', 'slight_smile'),
        plain(' '),
        emoticon(':)', 'slight_smile'),
      ]),
    ],
  ],

  // Should render BigEmojis
  [
    `:)
  :)
  `,
    [
      bigEmoji([
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
      ]),
    ],
  ],
  [
    ':):):)',
    [
      bigEmoji([
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
      ]),
    ],
  ],

  [
    ' :):):) ',
    [
      bigEmoji([
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
      ]),
    ],
  ],

  [
    '\n :):):) \n',
    [
      bigEmoji([
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
      ]),
    ],
  ],
  [
    ':)  :)  :)',
    [
      bigEmoji([
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
      ]),
    ],
  ],

  [
    ':) :)',
    [
      bigEmoji([
        emoticon(':)', 'slight_smile'),
        emoticon(':)', 'slight_smile'),
      ]),
    ],
  ],
  [':)', [bigEmoji([emoticon(':)', 'slight_smile')])]],
  [' :)', [bigEmoji([emoticon(':)', 'slight_smile')])]],
  [':) ', [bigEmoji([emoticon(':)', 'slight_smile')])]],
  [' :) ', [bigEmoji([emoticon(':)', 'slight_smile')])]],
  ['D:', [bigEmoji([emoticon('D:', 'fearful')])]],
  ['D: D:', [bigEmoji([emoticon('D:', 'fearful'), emoticon('D:', 'fearful')])]],
  [
    ' D: D: D: ',
    [
      bigEmoji([
        emoticon('D:', 'fearful'),
        emoticon('D:', 'fearful'),
        emoticon('D:', 'fearful'),
      ]),
    ],
  ],
  ['Hi D:', [paragraph([plain('Hi '), emoticon('D:', 'fearful')])]],

  // Should not render Emojis or BigEmojis if they are not surrounded by spaces
  ['normal emojis :):):)', [paragraph([plain('normal emojis :):):)')])]],
  [':)10:30', [paragraph([plain(':)10:30')])]],
  [':smile::)text', [paragraph([plain(':smile::)text')])]],
  ['text:):smile:', [paragraph([plain('text:):smile:')])]],
  ['text:):)', [paragraph([plain('text:):)')])]],
  [':):):) normal emojis', [paragraph([plain(':):):) normal emojis')])]],
  [':):):):)', [paragraph([plain(':):):):)')])]],
  ['10:30', [paragraph([plain('10:30')])]],
  ['he:)llo', [paragraph([plain('he:)llo')])]],
  [':)Hi', [paragraph([plain(':)Hi')])]],
  ['Hi:) Hi', [paragraph([plain('Hi:) Hi')])]],
  ['Hi:)', [paragraph([plain('Hi:)')])]],
  ['@#@#! :)@!@', [paragraph([plain('@#@#! :)@!@')])]],
])('parses %p', (input, output) => {
  expect(parse(input, { emoticons: true })).toMatchObject(output);
});
