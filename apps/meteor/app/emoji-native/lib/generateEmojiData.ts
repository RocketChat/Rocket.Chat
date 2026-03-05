import type { Emoji } from 'emojibase';
import data from 'emojibase-data/en/data.json';
import shortcodes from 'emojibase-data/en/shortcodes/emojibase.json';

// Map emojibase group numbers to our category keys
const groupToCategory: Record<number, string> = {
	0: 'people', // smileys & emotion
	1: 'people', // people & body
	2: 'people', // component - skin tones etc (we skip these)
	3: 'nature', // animals & nature
	4: 'food', // food & drink
	5: 'travel', // travel & places
	6: 'activity', // activities
	7: 'objects', // objects
	8: 'symbols', // symbols
	9: 'flags', // flags
};

export type EmojiEntry = {
	uc_base: string;
	uc_output: string;
	uc_match: string;
	uc_greedy: string;
	shortnames: string[];
	category: string;
	emojiPackage: string;
	unicode: string;
};

function hexFromEmoji(emoji: string): string {
	return [...emoji].map((cp) => cp.codePointAt(0)!.toString(16)).join('-');
}

function getShortcodes(hexcode: string): string[] {
	const entry = (shortcodes as Record<string, string | string[]>)[hexcode];
	if (!entry) return [];
	return Array.isArray(entry) ? entry : [entry];
}

function buildEmojiData() {
	const emojiList: Record<string, EmojiEntry> = {};
	const emojisByCategory: Record<string, string[]> = {
		people: [],
		nature: [],
		food: [],
		activity: [],
		travel: [],
		objects: [],
		symbols: [],
		flags: [],
	};
	const toneList: Record<string, number> = {};

	for (const emojiData of data as Emoji[]) {
		// Skip component group (skin tones, hair styles)
		if (emojiData.group === 2) continue;

		const category = groupToCategory[emojiData.group ?? -1];
		if (!category) continue;

		const codes = getShortcodes(emojiData.hexcode);
		if (codes.length === 0) continue;

		const primaryShortcode = codes[0];
		const altShortcodes = codes.slice(1).map((s) => `:${s}:`);
		const hex = hexFromEmoji(emojiData.emoji);

		const entry: EmojiEntry = {
			uc_base: hex,
			uc_output: hex,
			uc_match: hex,
			uc_greedy: hex,
			shortnames: altShortcodes,
			category,
			emojiPackage: 'native',
			unicode: emojiData.emoji,
		};

		const key = `:${primaryShortcode}:`;
		emojiList[key] = entry;

		// Only add to category if it's NOT a skin tone variant
		if (!emojiData.tone) {
			emojisByCategory[category].push(primaryShortcode);
		}

		// Register alternate shortcodes
		for (const alt of altShortcodes) {
			emojiList[alt] = entry;
		}

		// Track skin tone support
		if (emojiData.skins && emojiData.skins.length > 0) {
			toneList[primaryShortcode] = 1;

			// Register skin tone variants
			for (const skin of emojiData.skins) {
				if (!skin.tone) continue;

				const toneNum = Array.isArray(skin.tone) ? skin.tone[0] : skin.tone;
				const toneKey = `:${primaryShortcode}_tone${toneNum}:`;
				const skinHex = hexFromEmoji(skin.emoji);

				emojiList[toneKey] = {
					uc_base: skinHex,
					uc_output: skinHex,
					uc_match: skinHex,
					uc_greedy: skinHex,
					shortnames: [],
					category,
					emojiPackage: 'native',
					unicode: skin.emoji,
				};
			}
		}
	}

	return { emojiList, emojisByCategory, toneList };
}

// Build once and cache
let _cached: ReturnType<typeof buildEmojiData> | null = null;

export function getEmojiData() {
	if (!_cached) {
		_cached = buildEmojiData();
	}
	return _cached;
}
