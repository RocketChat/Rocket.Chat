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
	['Hi :thumbsup_tone3:', [paragraph([plain('Hi '), emoji('thumbsup_tone3')])]],
	['Hi :yes_tone3:', [paragraph([plain('Hi '), emoji('yes_tone3')])]],
	['Hi :clapping_hands_tone2:', [paragraph([plain('Hi '), emoji('clapping_hands_tone2')])]],
	['Hi :pray_tone4:', [paragraph([plain('Hi '), emoji('pray_tone4')])]],
	['Hi :regional_indicator_a:', [paragraph([plain('Hi '), emoji('regional_indicator_a')])]],
	['Hi :digit_zero:', [paragraph([plain('Hi '), emoji('digit_zero')])]],
	['Hi :pound_symbol:', [paragraph([plain('Hi '), emoji('pound_symbol')])]],
	['Hi :asterisk_symbol:', [paragraph([plain('Hi '), emoji('asterisk_symbol')])]],
	['Hi :tone3:', [paragraph([plain('Hi '), emoji('tone3')])]],
	[':thumbsup_tone3:', [bigEmoji([emoji('thumbsup_tone3')])]],
	[':regional_indicator_a:', [bigEmoji([emoji('regional_indicator_a')])]],
	[':digit_zero:', [bigEmoji([emoji('digit_zero')])]],
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
	['✋🏽', [bigEmoji([emojiUnicode('✋🏽')])]],
	['✌🏽', [bigEmoji([emojiUnicode('✌🏽')])]],
	['✍🏽', [bigEmoji([emojiUnicode('✍🏽')])]],
	['☝🏽', [bigEmoji([emojiUnicode('☝🏽')])]],
	['⛹🏽', [bigEmoji([emojiUnicode('⛹🏽')])]],
	['✋🏽✌🏽', [bigEmoji([emojiUnicode('✋🏽'), emojiUnicode('✌🏽')])]],
	['✋🏺', [bigEmoji([emojiUnicode('✋'), emojiUnicode('🏺')])]],
	['Hi ✋🏽', [paragraph([plain('Hi '), emojiUnicode('✋🏽')])]],
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
	// ZWJ sequences anchored by an Emoticon (U+1F600-U+1F64F)
	['😶‍🌫️', [bigEmoji([emojiUnicode('😶‍🌫️')])]],
	['😮‍💨', [bigEmoji([emojiUnicode('😮‍💨')])]],
	['😵‍💫', [bigEmoji([emojiUnicode('😵‍💫')])]],
	['Hi 😶‍🌫️', [paragraph([plain('Hi '), emojiUnicode('😶‍🌫️')])]],
	['😶‍🌫️😮‍💨', [bigEmoji([emojiUnicode('😶‍🌫️'), emojiUnicode('😮‍💨')])]],
	['🙋🏽‍♂️', [bigEmoji([emojiUnicode('🙋🏽‍♂️')])]],
	['😀', [bigEmoji([emojiUnicode('😀')])]], // standalone emoticon still matches
	// Emoji tag sequences — England/Scotland/Wales flags
	['🏴󠁧󠁢󠁥󠁮󠁧󠁿', [bigEmoji([emojiUnicode('🏴󠁧󠁢󠁥󠁮󠁧󠁿')])]],
	['🏴󠁧󠁢󠁳󠁣󠁴󠁿', [bigEmoji([emojiUnicode('🏴󠁧󠁢󠁳󠁣󠁴󠁿')])]],
	['🏴󠁧󠁢󠁷󠁬󠁳󠁿', [bigEmoji([emojiUnicode('🏴󠁧󠁢󠁷󠁬󠁳󠁿')])]],
	['Hi 🏴󠁧󠁢󠁥󠁮󠁧󠁿', [paragraph([plain('Hi '), emojiUnicode('🏴󠁧󠁢󠁥󠁮󠁧󠁿')])]],
	['🏴', [bigEmoji([emojiUnicode('🏴')])]], // standalone black flag still matches
	['🏴‍☠️', [bigEmoji([emojiUnicode('🏴‍☠️')])]], // pirate flag (ZWJ, not tag sequence) still matches
	// Consecutive sequence emojis — each sequence must be consumed whole, without stealing from its neighbor
	['🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿', [bigEmoji([emojiUnicode('🏴󠁧󠁢󠁥󠁮󠁧󠁿'), emojiUnicode('🏴󠁧󠁢󠁳󠁣󠁴󠁿'), emojiUnicode('🏴󠁧󠁢󠁷󠁬󠁳󠁿')])]],
	['🏴🏴󠁧󠁢󠁥󠁮󠁧󠁿', [bigEmoji([emojiUnicode('🏴'), emojiUnicode('🏴󠁧󠁢󠁥󠁮󠁧󠁿')])]],
	['🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴', [bigEmoji([emojiUnicode('🏴󠁧󠁢󠁥󠁮󠁧󠁿'), emojiUnicode('🏴')])]],
	['😶‍🌫️😮‍💨😵‍💫', [bigEmoji([emojiUnicode('😶‍🌫️'), emojiUnicode('😮‍💨'), emojiUnicode('😵‍💫')])]],
	['😀😶‍🌫️', [bigEmoji([emojiUnicode('😀'), emojiUnicode('😶‍🌫️')])]],
	['😶‍🌫️🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴‍☠️', [bigEmoji([emojiUnicode('😶‍🌫️'), emojiUnicode('🏴󠁧󠁢󠁥󠁮󠁧󠁿'), emojiUnicode('🏴‍☠️')])]],
	// More than 3 emojis: no BigEmoji, plain paragraph of emoji tokens
	['😶‍🌫️😮‍💨😵‍💫👍', [paragraph([emojiUnicode('😶‍🌫️'), emojiUnicode('😮‍💨'), emojiUnicode('😵‍💫'), emojiUnicode('👍')])]],
	['England 🏴󠁧󠁢󠁥󠁮󠁧󠁿 and Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿', [paragraph([plain('England '), emojiUnicode('🏴󠁧󠁢󠁥󠁮󠁧󠁿'), plain(' and Scotland '), emojiUnicode('🏴󠁧󠁢󠁳󠁣󠁴󠁿')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
