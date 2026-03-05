import type { Emoji } from 'emojibase';
import data from 'emojibase-data/en/data.json';
import shortcodes from 'emojibase-data/en/shortcodes/emojibase.json';

let _unicodeToShort: Map<string, string> | null = null;
let _shortToUnicode: Map<string, string> | null = null;

function getShortcodes(hexcode: string): string[] {
	const entry = (shortcodes as Record<string, string | string[]>)[hexcode];
	if (!entry) return [];
	return Array.isArray(entry) ? entry : [entry];
}

function buildMaps() {
	_unicodeToShort = new Map();
	_shortToUnicode = new Map();

	for (const emoji of data as Emoji[]) {
		const codes = getShortcodes(emoji.hexcode);
		if (codes.length === 0) continue;

		const shortname = `:${codes[0]}:`;
		_unicodeToShort.set(emoji.emoji, shortname);
		_shortToUnicode.set(shortname, emoji.emoji);

		for (const alt of codes.slice(1)) {
			_shortToUnicode.set(`:${alt}:`, emoji.emoji);
		}

		if (emoji.skins) {
			for (const skin of emoji.skins) {
				const skinCodes = getShortcodes(skin.hexcode);
				if (skinCodes.length > 0) {
					_unicodeToShort.set(skin.emoji, `:${skinCodes[0]}:`);
				}
			}
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
	return _unicodeToShort!.get(text) ?? text;
}

export function shortnameToUnicode(text: string): string {
	ensureMaps();
	return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match) => {
		return _shortToUnicode!.get(match) ?? match;
	});
}
