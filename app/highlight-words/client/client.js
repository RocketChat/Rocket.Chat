import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { highlightWords, getRegexHighlight, getRegexHighlightUrl } from './helper';
import { callbacks } from '../../callbacks';
import { getUserPreference } from '../../utils';

const createHighlightWordsMessageRenderer = ({ wordsToHighlight }) => {
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

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = getUserPreference(Meteor.userId(), 'highlights')?.some((highlight) => highlight?.trim()) ?? false;

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'highlight-words');
			return;
		}

		const wordsToHighlight = getUserPreference(Meteor.userId(), 'highlights')
			.filter((highlight) => highlight?.trim());

		const renderMessage = createHighlightWordsMessageRenderer({
			wordsToHighlight,
		});

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM + 1, 'highlight-words');
	});
});
