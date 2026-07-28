import { shortnameToUnicode, unicodeToShortname } from './emojiConverter';

describe('shortnameToUnicode', () => {
	it('converts joypixels-primary shortnames', () => {
		expect(shortnameToUnicode(':slight_smile:')).toBe('🙂');
		expect(shortnameToUnicode(':smiley:')).toBe('😃');
	});

	it('resolves contested shortcodes to the joypixels meaning', () => {
		expect(shortnameToUnicode(':cat:')).toBe('🐱');
	});

	it('converts legacy emojione-only shortnames', () => {
		expect(shortnameToUnicode(':digit_one:')).toBe('1️⃣');
	});

	it('converts skin-tone variants', () => {
		expect(shortnameToUnicode(':thumbsup_tone3:')).toBe('👍🏽');
	});

	it('keeps unknown shortnames as text', () => {
		expect(shortnameToUnicode(':not_a_real_emoji:')).toBe(':not_a_real_emoji:');
	});
});

describe('unicodeToShortname', () => {
	it('emits joypixels-primary shortnames valid in the app emoji list', () => {
		expect(unicodeToShortname('😃')).toBe(':smiley:');
	});

	it('matches unqualified (FE0F-stripped) emoji', () => {
		expect(unicodeToShortname('\u{1F44D}')).toBe(':thumbsup:');
		expect(unicodeToShortname('❤')).toBe(':heart:');
	});

	it('matches fully-qualified emoji', () => {
		expect(unicodeToShortname('\u{1F44D}️')).toBe(':thumbsup:');
	});

	it('returns unknown text unchanged', () => {
		expect(unicodeToShortname('abc')).toBe('abc');
	});
});
