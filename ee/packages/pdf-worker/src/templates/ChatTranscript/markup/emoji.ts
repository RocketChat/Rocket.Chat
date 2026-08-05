import data from 'emojibase-data/en/data.json';
import shortcodes from 'emojibase-data/en/shortcodes/emojibase.json';

type EmojibaseEntry = { emoji: string; hexcode: string; skins?: { emoji: string; hexcode: string }[] };

let unicodeToShort: Map<string, string> | null = null;

const firstShortcode = (hexcode: string): string | undefined => {
	const entry = (shortcodes as Record<string, string | string[]>)[hexcode];
	if (!entry) {
		return undefined;
	}
	return Array.isArray(entry) ? entry[0] : entry;
};

const stripVariationSelectors = (unicode: string): string => unicode.replace(/\p{Variation_Selector}/gu, '');

const buildMap = (): Map<string, string> => {
	const map = new Map<string, string>();
	for (const emoji of data as EmojibaseEntry[]) {
		const code = firstShortcode(emoji.hexcode);
		if (code) {
			map.set(stripVariationSelectors(emoji.emoji), `:${code}:`);
		}
		for (const skin of emoji.skins ?? []) {
			const skinCode = firstShortcode(skin.hexcode);
			if (skinCode) {
				map.set(stripVariationSelectors(skin.emoji), `:${skinCode}:`);
			}
		}
	}
	return map;
};

export const unicodeToShortname = (unicode: string): string => {
	if (!unicodeToShort) {
		unicodeToShort = buildMap();
	}
	return unicodeToShort.get(stripVariationSelectors(unicode)) ?? unicode;
};
