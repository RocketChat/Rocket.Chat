import type { Emoji } from 'emojibase';
import data from 'emojibase-data/en/data.json';
import emojibaseShortcodes from 'emojibase-data/en/shortcodes/emojibase.json';
import joypixelsShortcodes from 'emojibase-data/en/shortcodes/joypixels.json';

// Mirrors apps/meteor/app/emoji-native/lib/legacyEmojioneMap.ts: shortcodes that existed in
// emojione but are absent from both presets, still stored in old reactions.
const legacyEmojioneMap: Record<string, string> = {
	bride_with_veil_tone1: '👰🏻',
	bride_with_veil_tone2: '👰🏼',
	bride_with_veil_tone3: '👰🏽',
	bride_with_veil_tone4: '👰🏾',
	bride_with_veil_tone5: '👰🏿',
	bride_with_veil: '👰',
	digit_zero: '0️⃣',
	digit_one: '1️⃣',
	digit_two: '2️⃣',
	digit_three: '3️⃣',
	digit_four: '4️⃣',
	digit_five: '5️⃣',
	digit_six: '6️⃣',
	digit_seven: '7️⃣',
	digit_eight: '8️⃣',
	digit_nine: '9️⃣',
	pound_symbol: '#️⃣',
	asterisk_symbol: '*️⃣',
};

let _unicodeToShort: Map<string, string> | null = null;
let _shortToUnicode: Map<string, string> | null = null;

function getShortcodes(hexcode: string): string[] {
	// joypixels first, matching the app's emoji list (apps/meteor/app/emoji-native/lib/generateEmojiData.ts),
	// so the shortnames we emit are valid there and the ones we receive resolve here
	const entry =
		(joypixelsShortcodes as Record<string, string | string[]>)[hexcode] ??
		(emojibaseShortcodes as Record<string, string | string[]>)[hexcode];
	if (!entry) return [];
	return Array.isArray(entry) ? entry : [entry];
}

const VS16 = String.fromCodePoint(0xfe0f);

function registerUnicode(unicode: string, shortname: string) {
	_unicodeToShort!.set(unicode, shortname);
	// Matrix clients commonly send unqualified keys (no U+FE0F)
	const bare = unicode.replaceAll(VS16, '');
	if (bare !== unicode && !_unicodeToShort!.has(bare)) {
		_unicodeToShort!.set(bare, shortname);
	}
}

function buildMaps() {
	_unicodeToShort = new Map();
	_shortToUnicode = new Map();

	for (const emoji of data as Emoji[]) {
		const codes = getShortcodes(emoji.hexcode);
		if (codes.length === 0) continue;

		registerUnicode(emoji.emoji, `:${codes[0]}:`);
		for (const code of codes) {
			_shortToUnicode.set(`:${code}:`, emoji.emoji);
		}

		if (emoji.skins) {
			for (const skin of emoji.skins) {
				const skinCodes = getShortcodes(skin.hexcode);
				if (skinCodes.length > 0) {
					registerUnicode(skin.emoji, `:${skinCodes[0]}:`);
					for (const code of skinCodes) {
						_shortToUnicode.set(`:${code}:`, skin.emoji);
					}
				}
			}
		}
	}

	for (const [code, unicode] of Object.entries(legacyEmojioneMap)) {
		if (!_shortToUnicode.has(`:${code}:`)) {
			_shortToUnicode.set(`:${code}:`, unicode);
		}
	}
}

function ensureMaps() {
	if (!_unicodeToShort || !_shortToUnicode) {
		buildMaps();
	}
}

export function unicodeToShortname(text: string): string {
	ensureMaps();
	return _unicodeToShort!.get(text) ?? _unicodeToShort!.get(text.replaceAll(VS16, '')) ?? text;
}

export function shortnameToUnicode(text: string): string {
	ensureMaps();
	return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match) => {
		return _shortToUnicode!.get(match) ?? match;
	});
}
