import GraphemeSplitter from 'grapheme-splitter';

const splitter = new GraphemeSplitter();

export const messageProperties = {

	length: (message => {
		return splitter.countGraphemes(message);
	}),

	messageWithoutEmojiShortnames: (message => {
		return message.replace(/:\w+:/gm, (match) => {
			if (RocketChat.emoji.list[match] !== undefined) {
				return ' ';
			}
			return match;
		});
	})
};

// check for tests
if (typeof RocketChat !== 'undefined') {
	RocketChat.messageProperties = messageProperties;
}
