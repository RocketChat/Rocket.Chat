import { getEmojiData } from './generateEmojiData';
import { shortnameToUnicode } from './shortnameToUnicode';

describe('shortnameToUnicode', () => {
	it('should convert native shortnames to unicode', () => {
		expect(shortnameToUnicode('Hello :smile: :heart:')).toBe('Hello 😄 ❤️');
	});

	it('should convert legacy emojione shortnames to unicode', () => {
		// Guards that this shortname only resolves through the legacy map
		expect(getEmojiData().emojiList[':bride_with_veil:']).toBeUndefined();

		expect(shortnameToUnicode(':bride_with_veil:')).toBe('👰');
	});

	it('should leave unknown shortnames as they are', () => {
		expect(shortnameToUnicode('Hello :not_an_emoji:')).toBe('Hello :not_an_emoji:');
	});

	describe('with a transform', () => {
		it('should call it with the shortname including colons', () => {
			const transform = jest.fn(() => undefined);

			shortnameToUnicode('Hello :smile:', transform);

			expect(transform).toHaveBeenCalledTimes(1);
			expect(transform).toHaveBeenCalledWith(':smile:');
		});

		it('should prefer its result over a native emoji', () => {
			expect(shortnameToUnicode('Hello :troll: :smile:', (key) => (key === ':troll:' ? key : undefined))).toBe('Hello :troll: 😄');
		});

		it('should prefer its result over a legacy emojione shortname', () => {
			expect(shortnameToUnicode(':bride_with_veil:', (key) => key)).toBe(':bride_with_veil:');
		});

		it('should fall back to native conversion when it returns undefined', () => {
			expect(shortnameToUnicode('Hello :smile:', () => undefined)).toBe('Hello 😄');
		});

		it('should also be asked about unknown shortnames', () => {
			const transform = jest.fn(() => 'custom');

			expect(shortnameToUnicode(':not_an_emoji:', transform)).toBe('custom');
			expect(transform).toHaveBeenCalledWith(':not_an_emoji:');
		});

		it('should use an empty string result as the replacement', () => {
			expect(shortnameToUnicode('Hello :smile:!', () => '')).toBe('Hello !');
		});
	});
});
