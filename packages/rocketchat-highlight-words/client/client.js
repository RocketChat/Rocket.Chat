/*
 * Highlights is a named function that will process Highlights
 * @param {Object} message - The message object
 */
import { Meteor } from 'meteor/meteor';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { getUserPreference } from 'meteor/rocketchat:utils';
import _ from 'underscore';
import s from 'underscore.string';
import { highlightWords } from './helper';

function HighlightWordsClient(message) {
	let msg = message;
	if (!_.isString(message)) {
		if (s.trim(message.html)) {
			msg = message.html;
		} else {
			return message;
		}
	}

	const to_highlight = getUserPreference(Meteor.user(), 'highlights');
	msg = highlightWords(msg, to_highlight);

	message.html = msg;
	return message;
}

callbacks.add('renderMessage', HighlightWordsClient, callbacks.priority.MEDIUM + 1, 'highlight-words');
