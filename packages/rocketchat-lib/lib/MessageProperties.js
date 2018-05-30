import GraphemeSplitter from 'grapheme-splitter';

const splitter = new GraphemeSplitter();

export const messageProperties = ((message) => {
	return {
		length: splitter.countGraphemes(message)
	};
});

// check for tests
if (typeof RocketChat !== 'undefined') {
	RocketChat.messageProperties = messageProperties;
}
