import { getComposerEmojiInsertionText } from './getComposerEmojiInsertionText';

describe('getComposerEmojiInsertionText', () => {
	it('should convert a valid shortname into native unicode', () => {
		expect(getComposerEmojiInsertionText('smile')).toBe('\u{1F604}');
	});

	it('should convert a valid shortname with colons into native unicode', () => {
		expect(getComposerEmojiInsertionText(':thumbsup_tone2:')).toBe('\u{1F44D}\u{1F3FC}');
	});

	it('should keep unknown custom emoji shortnames unchanged', () => {
		expect(getComposerEmojiInsertionText('custom_sticker')).toBe(':custom_sticker:');
	});
});
