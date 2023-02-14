import { emoji } from '../../emoji';

export const messageProperties = {
	messageWithoutEmojiShortnames: (message) =>
		message.replace(/:\w+:/gm, (match) => {
			if (emoji.list[match] !== undefined) {
				return ' ';
			}
			return match;
		}),
};
