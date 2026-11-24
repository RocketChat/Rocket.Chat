import data from 'emojibase-data/en/data.json';
import shortcodes from 'emojibase-data/en/shortcodes/emojibase.json';

let maps: { unicodeToShort: Map<string, string>; shortToUnicode: Map<string, string> } | undefined;

function getShortcodes(hexcode: string): string[] {
	const entry = (shortcodes as Record<string, string | string[]>)[hexcode];
	if (!entry) return [];
	return Array.isArray(entry) ? entry : [entry];
}

function buildMaps() {
	const unicodeToShort = new Map<string, string>();
	const shortToUnicode = new Map<string, string>();

	for (const emoji of data) {
		const codes = getShortcodes(emoji.hexcode);
		if (codes.length === 0) continue;

		const shortname = `:${codes[0]}:`;
		unicodeToShort.set(emoji.emoji, shortname);
		shortToUnicode.set(shortname, emoji.emoji);

		for (const alt of codes.slice(1)) {
			shortToUnicode.set(`:${alt}:`, emoji.emoji);
		}

		if (emoji.skins) {
			for (const skin of emoji.skins) {
				const skinCodes = getShortcodes(skin.hexcode);
				if (skinCodes.length > 0) {
					unicodeToShort.set(skin.emoji, `:${skinCodes[0]}:`);
					for (const code of skinCodes) {
						shortToUnicode.set(`:${code}:`, skin.emoji);
					}
				}
			}
		}
	}

	return { unicodeToShort, shortToUnicode };
}

function getMaps() {
	maps ??= buildMaps();
	return maps;
}

export function unicodeToShortname(text: string): string {
	return getMaps().unicodeToShort.get(text) ?? text;
}

export function shortnameToUnicode(text: string): string {
	const { shortToUnicode } = getMaps();
	return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match) => {
		return shortToUnicode.get(match) ?? match;
	});
}
