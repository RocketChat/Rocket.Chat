import emojione from 'emoji-toolkit';

// Baseline for the native-emoji migration: the transcript's unicode -> shortname conversion
// (EmojiSpan) uses emoji-toolkit, whose vocabulary matches the app emoji list. The counterpart
// PR against release-8.7.0 carries the same expectations over the new emojibase-based module.
describe('emoji-toolkit shortname vocabulary (pre-native-migration baseline)', () => {
	it('names 👍 :thumbsup:', () => {
		expect(emojione.toShort('\u{1F44D}')).toBe(':thumbsup:');
	});

	it('names 😃 :smiley:', () => {
		expect(emojione.toShort('😃')).toBe(':smiley:');
	});
});
