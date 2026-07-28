import { unicodeToShortname } from './emoji';

describe('unicodeToShortname', () => {
	it('converts emoji without variation selector to shortname', () => {
		expect(unicodeToShortname('\u{1F44D}')).toBe(':+1:');
	});

	it('converts emoji with variation selector to shortname', () => {
		expect(unicodeToShortname('\u{1F44D}\u{FE0F}')).toBe(':+1:');
	});

	it('converts skin tone emoji to shortname', () => {
		expect(unicodeToShortname('\u{1F44D}\u{1F3FD}')).toBe(':+1_tone3:');
	});

	it('returns the input unchanged when no shortname exists', () => {
		expect(unicodeToShortname('not an emoji')).toBe('not an emoji');
	});

	describe('joypixels-first shortnames (parity with the app emoji list)', () => {
		it('names 👍 :thumbsup: like the transcript did before the native emoji migration', () => {
			expect(unicodeToShortname('\u{1F44D}')).toBe(':thumbsup:');
		});

		it('names 😃 :smiley: instead of the emojibase-only primary', () => {
			expect(unicodeToShortname('😃')).toBe(':smiley:');
		});
	});
});
