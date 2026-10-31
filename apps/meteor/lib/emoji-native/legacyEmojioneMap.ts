// Auto-generated legacy emojione shortcode mapping
// These shortcodes existed in emojione but are absent from the joypixels preset that
// `generateEmojiData` reads, so they are backfilled here to keep old stored messages and
// reactions resolving. `digit_*`, `pound_symbol` and `asterisk_symbol` were themselves
// hand-patched into emojione by Rocket.Chat, and `tone1`-`tone5` name skin-tone components,
// which are not emoji in their own right.

const legacyEmojioneMapData: Record<string, string> = {
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
	tone1: '🏻',
	tone2: '🏼',
	tone3: '🏽',
	tone4: '🏾',
	tone5: '🏿',
};

export const legacyEmojioneMap: Record<string, string> = Object.assign(Object.create(null), legacyEmojioneMapData);
