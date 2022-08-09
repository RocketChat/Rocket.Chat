import type { IMessage } from '@rocket.chat/core-typings';

import { highlightWords, getRegexHighlight, getRegexHighlightUrl } from './helper';

// TODO: delete this file after message rewrites
export const createHighlightWordsMessageRenderer = ({
	wordsToHighlight,
}: {
	wordsToHighlight: string[];
}): (<T extends IMessage & { html: string }>(message: T) => T) => {
	const highlights = wordsToHighlight.map((highlight) => ({
		highlight,
		regex: getRegexHighlight(highlight),
		urlRegex: getRegexHighlightUrl(highlight),
	}));

	return <T extends IMessage & { html: string }>(message: T): T => {
		if (!message.html?.trim()) {
			return message;
		}

		message.html = highlightWords(message.html, highlights);
		return message;
	};
};
