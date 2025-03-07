import { parse } from '../src';
import { emoji, bigEmoji, paragraph, plain, emojiUnicode } from '../src/utils';

describe('short-code emojis', () => {
  test.each([
    [':smile: asd', [paragraph([emoji('smile'), plain(' asd')])]],
    ['text:inner:outer', [paragraph([plain('text:inner:outer')])]],
    ['10:20:30', [paragraph([plain('10:20:30')])]],
    ['10:20:30:', [paragraph([plain('10:20:30:')])]],
    ['":smile:"', [paragraph([plain('":smile:"')])]],
    ['":smile: "', [paragraph([plain('":smile: "')])]],
    ['" :smile: "', [paragraph([plain('" '), emoji('smile'), plain(' "')])]],
    [
      `:smile:
  :smile:
  `,
      [bigEmoji([emoji('smile'), emoji('smile')])],
    ],
    [
      'asdas :smile: asd',
      [paragraph([plain('asdas '), emoji('smile'), plain(' asd')])],
    ],
    [
      'normal emojis :smile: :smile: :smile:',
      [
        paragraph([
          plain('normal emojis '),
          emoji('smile'),
          plain(' '),
          emoji('smile'),
          plain(' '),
          emoji('smile'),
        ]),
      ],
    ],
    [
      ':smile::smile::smile:',
      [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])],
    ],
    [
      ' :smile::smile::smile: ',
      [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])],
    ],
    [
      '\n :smile::smile::smile: \n',
      [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])],
    ],
    [
      ':smile:  :smile:  :smile:',
      [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])],
    ],
    [':smile::smile:', [bigEmoji([emoji('smile'), emoji('smile')])]],
    [':smile:', [bigEmoji([emoji('smile')])]],
    ['Hi :+1:', [paragraph([plain('Hi '), emoji('+1')])]],
    ['Hi :+1_tone4:', [paragraph([plain('Hi '), emoji('+1_tone4')])]],
    [':+1:?', [paragraph([emoji('+1'), plain('?')])]],
  ])('parses %p', (input, output) => {
    expect(parse(input)).toMatchObject(output);
  });
});

describe('unicode emojis', () => {
  test.each([
    ['😀', [bigEmoji([emojiUnicode('😀')])]],
    ['😃', [bigEmoji([emojiUnicode('😃')])]],
    ['🥵', [bigEmoji([emojiUnicode('🥵')])]],
    ['🧿', [bigEmoji([emojiUnicode('🧿')])]],
    ['🐶', [bigEmoji([emojiUnicode('🐶')])]],
    ['🍏', [bigEmoji([emojiUnicode('🍏')])]],
    ['⚽', [bigEmoji([emojiUnicode('⚽')])]],
    ['⚽️', [bigEmoji([emojiUnicode('⚽️')])]],
    ['👨‍👩‍👧‍👦', [bigEmoji([emojiUnicode('👨‍👩‍👧‍👦')])]],
    ['🚗', [bigEmoji([emojiUnicode('🚗')])]],
    ['⌚️', [bigEmoji([emojiUnicode('⌚️')])]],
    ['❤️', [bigEmoji([emojiUnicode('❤️')])]],
    ['🏳️', [bigEmoji([emojiUnicode('🏳️')])]],
    ['🧑🏾‍💻', [bigEmoji([emojiUnicode('🧑🏾‍💻')])]],
    ['🧑🏾‍💻🧑🏾‍💻', [bigEmoji([emojiUnicode('🧑🏾‍💻'), emojiUnicode('🧑🏾‍💻')])]],
    [
      '🧑🏾‍💻🧑🏾‍💻🧑🏾‍💻',
      [bigEmoji([emojiUnicode('🧑🏾‍💻'), emojiUnicode('🧑🏾‍💻'), emojiUnicode('🧑🏾‍💻')])],
    ],
    ['👆🏽', [bigEmoji([emojiUnicode('👆🏽')])]],
    ['👆🏽👆🏽', [bigEmoji([emojiUnicode('👆🏽'), emojiUnicode('👆🏽')])]],
    [
      '👆🏽👆🏽👆🏽',
      [bigEmoji([emojiUnicode('👆🏽'), emojiUnicode('👆🏽'), emojiUnicode('👆🏽')])],
    ],
    ['👆🏺', [bigEmoji([emojiUnicode('👆'), emojiUnicode('🏺')])]],
    ['Hi 👍', [paragraph([plain('Hi '), emojiUnicode('👍')])]],
  ])('parses %p', (input, output) => {
    expect(parse(input)).toMatchObject(output);
  });
});
