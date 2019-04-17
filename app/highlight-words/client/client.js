/*
 * Highlights is a named function that will process Highlights
 * @param {Object} message - The message object
 */
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { callbacks } from '../../callbacks';
import { getUserPreference } from '../../utils';
import _ from 'underscore';
import s from 'underscore.string';
import { highlightWords } from './helper';

let to_highlight;

Tracker.autorun(() => {
	to_highlight = getUserPreference(Meteor.userId(), 'highlights');
});

function HighlightWordsClient(message) {
	let msg = message;
	if (!_.isString(message)) {
		if (s.trim(message.html)) {
			msg = message.html;
		} else {
			return message;
		}
	}

	message.html = highlightWords(msg, to_highlight);
	return message;
}

callbacks.add('renderMessage', HighlightWordsClient, callbacks.priority.MEDIUM + 1, 'highlight-words');
