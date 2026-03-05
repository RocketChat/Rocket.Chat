import type { EmojiEntry } from './generateEmojiData';
import { getEmojiData } from './generateEmojiData';
import { shortnameToUnicode } from './shortnameToUnicode';

const emojiCategories = [
	{ key: 'people', i18n: 'Smileys_and_People' },
	{ key: 'nature', i18n: 'Animals_and_Nature' },
	{ key: 'food', i18n: 'Food_and_Drink' },
	{ key: 'activity', i18n: 'Activity' },
	{ key: 'travel', i18n: 'Travel_and_Places' },
	{ key: 'objects', i18n: 'Objects' },
	{ key: 'symbols', i18n: 'Symbols' },
	{ key: 'flags', i18n: 'Flags' },
];

function renderEmoji(text: string): string {
	const { emojiList } = getEmojiData();

	return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, shortcode) => {
		const key = `:${shortcode}:`;
		const emoji = emojiList[key] as EmojiEntry | undefined;
		if (!emoji?.unicode) return match;

		return `<span class="emoji" title="${match}">${emoji.unicode}</span>`;
	});
}

function renderPicker(emojiToRender: string): string | undefined {
	const { emojiList } = getEmojiData();
	const emoji = emojiList[emojiToRender] as EmojiEntry | undefined;
	if (!emoji?.unicode) return undefined;

	return `<span class="emoji" title="${emojiToRender}">${emoji.unicode}</span>`;
}

export const getEmojiConfig = () => {
	const { emojiList, emojisByCategory, toneList } = getEmojiData();

	return {
		emojiList,
		emojisByCategory,
		emojiCategories,
		toneList,
		render: renderEmoji,
		renderPicker,
		sprites: false,
		shortnameToUnicode,
	};
};
