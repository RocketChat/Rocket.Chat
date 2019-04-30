import { emoji } from '../../emoji';
import GraphemeSplitter from 'grapheme-splitter';

const splitter = new GraphemeSplitter();

export const messageProperties = {

	length: (message) => splitter.countGraphemes(message),

	messageWithoutEmojiShortnames: (message) => message.replace(/:\w+:/gm, (match) => {
		if (emoji.list[match] !== undefined) {
			return ' ';
		}
		return match;
	}),
};
