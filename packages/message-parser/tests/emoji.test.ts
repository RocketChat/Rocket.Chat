import { parse } from '../src';
import { emoji, bigEmoji, paragraph, plain, emojiUnicode } from './helpers';

test.each([
	[':smile: asd', [paragraph([emoji('smile'), plain(' asd')])]],
	[':smile:asd', [paragraph([plain(':smile:asd')])]],
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
	['asdas :smile: asd', [paragraph([plain('asdas '), emoji('smile'), plain(' asd')])]],
	[
		'normal emojis :smile: :smile: :smile:',
		[paragraph([plain('normal emojis '), emoji('smile'), plain(' '), emoji('smile'), plain(' '), emoji('smile')])],
	],
	[':smile::smile::smile:', [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])]],
	[' :smile::smile::smile: ', [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])]],
	['\n :smile::smile::smile: \n', [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])]],
	[':smile:  :smile:  :smile:', [bigEmoji([emoji('smile'), emoji('smile'), emoji('smile')])]],
	[':smile::smile:', [bigEmoji([emoji('smile'), emoji('smile')])]],
	[':smile:a:smile:', [paragraph([plain(':smile:a:smile:')])]],
	[':smile:', [bigEmoji([emoji('smile')])]],
	['Hi :+1:', [paragraph([plain('Hi '), emoji('+1')])]],
	['Hi :+1_tone4:', [paragraph([plain('Hi '), emoji('+1_tone4')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});

// Tests for unicode emojis
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
	['🧑🏾‍💻🧑🏾‍💻🧑🏾‍💻', [bigEmoji([emojiUnicode('🧑🏾‍💻'), emojiUnicode('🧑🏾‍💻'), emojiUnicode('🧑🏾‍💻')])]],
	['👆🏽', [bigEmoji([emojiUnicode('👆🏽')])]],
	['👆🏽👆🏽', [bigEmoji([emojiUnicode('👆🏽'), emojiUnicode('👆🏽')])]],
	['👆🏽👆🏽👆🏽', [bigEmoji([emojiUnicode('👆🏽'), emojiUnicode('👆🏽'), emojiUnicode('👆🏽')])]],
	['👆🏺', [bigEmoji([emojiUnicode('👆'), emojiUnicode('🏺')])]],
	['Hi 👍', [paragraph([plain('Hi '), emojiUnicode('👍')])]],
	// Symbols and Pictographs Extended-A (U+1FA00–U+1FAFF) — Unicode 13+/14+
	['🫠', [bigEmoji([emojiUnicode('🫠')])]],
	['🫡', [bigEmoji([emojiUnicode('🫡')])]],
	['🫶', [bigEmoji([emojiUnicode('🫶')])]],
	['Hi 🫠', [paragraph([plain('Hi '), emojiUnicode('🫠')])]],
	// ZWJ sequences involving Dingbats (❤️ U+2764) — couple/kiss emojis
	['👨‍❤️‍💋‍👨', [bigEmoji([emojiUnicode('👨‍❤️‍💋‍👨')])]],
	['👩‍❤️‍💋‍👩', [bigEmoji([emojiUnicode('👩‍❤️‍💋‍👩')])]],
	['👨‍❤️‍👨', [bigEmoji([emojiUnicode('👨‍❤️‍👨')])]],
	['💑', [bigEmoji([emojiUnicode('💑')])]],
	['Hi 👨‍❤️‍💋‍👨', [paragraph([plain('Hi '), emojiUnicode('👨‍❤️‍💋‍👨')])]],
	// ZWJ sequences involving Misc Symbols (⚕️, ⚖️, ✈️) — profession emojis
	['👨‍⚕️', [bigEmoji([emojiUnicode('👨‍⚕️')])]],
	['👩‍⚖️', [bigEmoji([emojiUnicode('👩‍⚖️')])]],
	['👨‍✈️', [bigEmoji([emojiUnicode('👨‍✈️')])]],
	['🩷', [bigEmoji([emojiUnicode('🩷')])]], // v15
	['🫱🏿‍🫲🏻', [bigEmoji([emojiUnicode('🫱🏿‍🫲🏻')])]], // v14
	['🫩', [bigEmoji([emojiUnicode('🫩')])]], // v16
	['🇨🇶', [bigEmoji([emojiUnicode('🇨🇶')])]], // v16
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
