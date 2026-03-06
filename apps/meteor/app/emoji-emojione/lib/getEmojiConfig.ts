import { emojiList } from './emojiData';
import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';
import { renderMessage, renderEmoji } from './unicodeConverters';

const settings = { ascii: true };

export const getEmojiConfig = () => ({
	emojiList,
	emojisByCategory,
	emojiCategories,
	toneList,
	render: (str: string) => renderMessage(str, settings.ascii),
	renderPicker: (shortname: string) => renderEmoji(shortname),
	sprites: false,
	get ascii() {
		return settings.ascii;
	},
	set ascii(value: boolean) {
		settings.ascii = value;
	},
});
