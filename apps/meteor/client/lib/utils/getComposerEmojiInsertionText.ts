import emojione from 'emojione';

const toShortname = (emoji: string): string => {
	const trimmedEmoji = emoji.trim();

	if (trimmedEmoji.startsWith(':') && trimmedEmoji.endsWith(':')) {
		return trimmedEmoji;
	}

	return `:${trimmedEmoji}:`;
};

export const getComposerEmojiInsertionText = (emoji: string): string => {
	return emojione.shortnameToUnicode(toShortname(emoji));
};
