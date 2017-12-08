/*
 * Hilights is a named function that will process Highlights
 * @param {Object} message - The message object
 */
import _ from 'underscore';
import s from 'underscore.string';

function HighlightWordsClient(message) {
	let msg = message;
	if (!_.isString(message)) {
		if (s.trim(message.html)) {
			msg = message.html;
		} else {
			return message;
		}
	}

	const to_highlight = Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.highlights;
	if (Array.isArray(to_highlight)) {
		to_highlight.forEach((highlight) => {
			if (!s.isBlank(highlight)) {
				return msg = msg.replace(new RegExp(`(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${ s.escapeRegExp(highlight) })($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)`, 'gmi'), '$1<span class="highlight-text">$2</span>$3');
			}
		});
	}

	message.html = msg;
	return message;
}

RocketChat.callbacks.add('renderMessage', HighlightWordsClient, RocketChat.callbacks.priority.MEDIUM + 1, 'highlight-words');
