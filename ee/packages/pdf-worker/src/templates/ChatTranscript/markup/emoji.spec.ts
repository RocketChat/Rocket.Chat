import { unicodeToShortname } from './emoji';

// The app emoji list is joypixels-first since #41587; the transcript must emit the same
// vocabulary users see in-app (pre-migration, emoji-toolkit produced these names too)
describe('unicodeToShortname', () => {
	it('converts emoji without variation selector to shortname', () => {
		expect(unicodeToShortname('\u{1F44D}')).toBe(':thumbsup:');
	});

	it('converts emoji with variation selector to shortname', () => {
		expect(unicodeToShortname('\u{1F44D}\u{FE0F}')).toBe(':thumbsup:');
	});

	it('converts skin tone emoji to shortname', () => {
		expect(unicodeToShortname('\u{1F44D}\u{1F3FD}')).toBe(':thumbsup_tone3:');
	});

	it('uses the app vocabulary where emojibase primaries diverge', () => {
		expect(unicodeToShortname('😃')).toBe(':smiley:');
	});

	it('returns the input unchanged when no shortname exists', () => {
		expect(unicodeToShortname('not an emoji')).toBe('not an emoji');
	});
});
