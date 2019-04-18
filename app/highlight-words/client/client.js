/*
 * Highlights is a named function that will process Highlights
 * @param {Object} message - The message object
 */
import _ from 'underscore';
import s from 'underscore.string';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../callbacks';
import { getUserPreference } from '../../utils';
import { highlightWords, getRegexHighlight, getRegexHighlightUrl } from './helper';

Tracker.autorun(() => {
	const toHighlight = (getUserPreference(Meteor.userId(), 'highlights') || []).filter((highlight) => !s.isBlank(highlight)).map((highlight) => ({
		highlight,
		regex: getRegexHighlight(highlight),
		urlRegex: getRegexHighlightUrl(highlight),
	}));

	if (!toHighlight.length) {
		return callbacks.remove('renderMessage', 'highlight-words');
	}

	function HighlightWordsClient(message) {
		let msg = message;

		if (!_.isString(message)) {
			if (!s.trim(message.html)) {
				return message;
			}
			msg = message.html;
		}

		message.html = highlightWords(msg, toHighlight);
		return message;
	}
	callbacks.add('renderMessage', HighlightWordsClient, callbacks.priority.MEDIUM + 1, 'highlight-words');
});
