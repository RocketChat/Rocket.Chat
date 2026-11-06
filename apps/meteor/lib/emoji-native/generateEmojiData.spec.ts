import type { Emoji } from 'emojibase';
import data from 'emojibase-data/en/data.json';
import emojibaseShortcodes from 'emojibase-data/en/shortcodes/emojibase.json';
import joypixelsShortcodes from 'emojibase-data/en/shortcodes/joypixels.json';

import type { EmojiEntry } from './generateEmojiData';
import { getEmojiData } from './generateEmojiData';
import { legacyEmojioneMap } from './legacyEmojioneMap';
import { shortnameToUnicode } from './shortnameToUnicode';

const asArray = (entry: string | string[] | undefined): string[] => {
	if (!entry) return [];
	return Array.isArray(entry) ? entry : [entry];
};

/**
 * The emoji we expose shortcodes for, derived independently from `generateEmojiData` so this suite
 * fails if the two ever drift apart.
 */
const emittedEmojis = (() => {
	const emojis = new Map<string, string>();

	for (const emojiData of data as Emoji[]) {
		if (emojiData.group === 2) continue;

		const { hexcode } = emojiData;
		const codepoint = hexcode.includes('-') ? NaN : parseInt(hexcode, 16);
		const isRegional = codepoint >= 0x1f1e6 && codepoint <= 0x1f1ff;
		if (emojiData.group === undefined && !isRegional) continue;

		emojis.set(hexcode, emojiData.emoji);
		for (const skin of emojiData.skins ?? []) {
			if (!skin.tone) continue;
			emojis.set(skin.hexcode, skin.emoji);
		}
	}

	return emojis;
})();

describe('native emoji shortcodes', () => {
	const { emojiList, emojisByCategory } = getEmojiData();

	const unicodeOf = (shortcode: string) => emojiList[`:${shortcode}:`]?.unicode;

	// Shortcodes both presets define, pointing at different emoji. Reaction keys and message
	// shortcodes stored before the native emoji migration — and everything the mobile clients
	// send today — use the joypixels/emojione meaning, so these must not follow emojibase.
	describe.each([
		['up', '🆙', 'arrow_up_small', '🔼'],
		['cat', '🐱', 'cat2', '🐈️'],
		['dog', '🐶', 'dog2', '🐕️'],
		['o', '⭕️', 'o2', '🅾️'],
		['point_up', '☝️', 'point_up_2', '👆️'],
		['sunglasses', '😎', 'dark_sunglasses', '🕶️'],
		['pencil', '📝', 'pencil2', '✏️'],
		['train', '🚋', 'train2', '🚆'],
		['whale', '🐳', 'whale2', '🐋'],
		['umbrella', '☔️', 'umbrella2', '☂️'],
		['computer', '💻️', 'desktop_computer', '🖥️'],
		['satellite', '📡', 'satellite_orbital', '🛰️'],
		['tiger', '🐯', 'tiger2', '🐅'],
		['no', '🇳🇴', 'thumbsdown', '👎️'],
		['om', '🇴🇲', 'om_symbol', '🕉️'],
		['sunny', '☀️', 'white_sun_small_cloud', '🌤️'],
		['japan', '🗾', 'flag_jp', '🇯🇵'],
	])('contested shortcode :%s:', (contested, expected, displacedShortcode, displaced) => {
		it(`resolves to ${expected}, not ${displaced}`, () => {
			expect(unicodeOf(contested)).toBe(expected);
		});

		it(`leaves ${displaced} reachable as :${displacedShortcode}:`, () => {
			expect(unicodeOf(displacedShortcode)).toBe(displaced);
		});
	});

	it('falls back to emojibase for emoji joypixels never named', () => {
		// joypixels stopped shipping, so everything added to Unicode since then only has an
		// emojibase name — without the fallback these emoji disappear from the picker entirely
		expect(unicodeOf('fingerprint')).toBe('🫆');
		expect(unicodeOf('face_with_eye_bags')).toBe('🫩');
		expect(unicodeOf('leafless_tree')).toBe('🪾');
		expect(unicodeOf('root_vegetable')).toBe('🫜');
	});

	it('only backfills legacy shortcodes the presets do not provide', () => {
		// the map is hand-generated; if a preset already names a shortcode, the entry is dead weight
		// and, worse, hides which name is authoritative
		const redundant = Object.keys(legacyEmojioneMap).filter((shortcode) => emojiList[`:${shortcode}:`]);

		expect(redundant).toEqual([]);
	});

	it('resolves the legacy shortcodes that survived', () => {
		expect(shortnameToUnicode(':bride_with_veil:')).toBe('👰');
		expect(shortnameToUnicode(':bride_with_veil_tone3:')).toBe('👰🏽');
		expect(shortnameToUnicode(':digit_zero:')).toBe('0️⃣');
		expect(shortnameToUnicode(':tone3:')).toBe('🏽');
	});

	it('keeps joypixels aliases of contested emoji working', () => {
		expect(unicodeOf('point_up_2')).toBe('👆️');
		expect(unicodeOf('cat_face')).toBe('🐱');
		expect(unicodeOf('tram_car')).toBe('🚋');
	});

	it('applies the same precedence to skin tone variants', () => {
		expect(unicodeOf('point_up_tone1')).toBe('☝🏻');
		expect(unicodeOf('point_up_2_tone1')).toBe('👆🏻');
	});

	it('resolves contested shortcodes to unicode for shortnameToUnicode consumers', () => {
		expect(shortnameToUnicode(':up:')).toBe('🆙');
		expect(shortnameToUnicode(':cat:')).toBe('🐱');
		expect(shortnameToUnicode(':o:')).toBe('⭕️');
	});

	it('gives joypixels precedence for every shortcode the two presets contest', () => {
		const contested: string[] = [];

		for (const [hexcode, emoji] of emittedEmojis) {
			for (const shortcode of asArray((joypixelsShortcodes as Record<string, string | string[]>)[hexcode])) {
				const entry = emojiList[`:${shortcode}:`];
				if (entry && entry.unicode !== emoji) {
					contested.push(`:${shortcode}: is ${entry.unicode}, joypixels says ${emoji}`);
				}
			}
		}

		expect(contested).toEqual([]);
	});

	it('never strands an emoji without a shortcode', () => {
		const stranded: string[] = [];
		const reachable = new Set(Object.values(emojiList).map((entry) => entry.unicode));

		for (const [hexcode, emoji] of emittedEmojis) {
			const hadShortcode =
				asArray((emojibaseShortcodes as Record<string, string | string[]>)[hexcode]).length > 0 ||
				asArray((joypixelsShortcodes as Record<string, string | string[]>)[hexcode]).length > 0;

			if (hadShortcode && !reachable.has(emoji)) {
				stranded.push(`${emoji} (${hexcode})`);
			}
		}

		expect(stranded).toEqual([]);
	});

	it('keeps every picker entry resolvable', () => {
		const unresolvable = Object.values(emojisByCategory)
			.flat()
			.filter((shortcode) => !emojiList[`:${shortcode}:`]);

		expect(unresolvable).toEqual([]);
	});

	it('keeps every picker entry pointing at its own emoji', () => {
		// a picker entry whose name resolves to a *different* emoji would insert the wrong emoji
		const misdirected = Object.values(emojisByCategory)
			.flat()
			.filter((shortcode) => emojiList[`:${shortcode}:`]?.name !== shortcode);

		expect(misdirected).toEqual([]);
	});

	it('registers the primary shortcode before any of its aliases', () => {
		// picker search and unicodeToShortcodeMap both take the first registered name for an entry,
		// so an alias registered ahead of the primary surfaces the wrong name to users
		const firstSeen = new Map<EmojiEntry, string>();
		for (const [shortcode, entry] of Object.entries(emojiList)) {
			if (!firstSeen.has(entry)) firstSeen.set(entry, shortcode);
		}

		const outOfOrder = Object.values(emojisByCategory)
			.flat()
			.filter((shortcode) => firstSeen.get(emojiList[`:${shortcode}:`]) !== `:${shortcode}:`);

		expect(outOfOrder).toEqual([]);
	});

	it('never lists a shortname that resolves to another emoji', () => {
		// emoji picker search reads `shortnames`, so a stale alias surfaces the wrong result
		const stale: string[] = [];

		for (const entry of Object.values(emojiList)) {
			for (const shortname of entry.shortnames) {
				if (emojiList[shortname] !== entry) {
					stale.push(`${entry.unicode} lists ${shortname}, which resolves to ${emojiList[shortname]?.unicode}`);
				}
			}
		}

		expect(stale).toEqual([]);
	});
});
