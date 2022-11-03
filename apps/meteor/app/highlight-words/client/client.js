import { highlightWords, getRegexHighlight, getRegexHighlightUrl } from './helper';

export const createHighlightWordsMessageRenderer = ({ wordsToHighlight }) => {
	const highlights = wordsToHighlight.map((highlight) => ({
		highlight,
		regex: getRegexHighlight(highlight),
		urlRegex: getRegexHighlightUrl(highlight),
	}));

	return (message) => {
		if (!message.html?.trim()) {
			return message;
		}

		message.html = highlightWords(message.html, highlights);
		return message;
	};
};
