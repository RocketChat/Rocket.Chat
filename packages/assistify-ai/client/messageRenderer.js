import { RocketChat } from 'meteor/rocketchat:lib';
import s from 'underscore.string';

/**
 * This function is used as a callback which is executed while rendering the message.
 * @see /packages/rocketchat-ui-message/client/renderMessageBody.js
 * @param {*} message the message object including all properties
 * @augments message.html - the rendered message body
 */
const highlightRecognizedTerms = function(message) {
	const { recognizedTerms } = message;
	console.info('Highlighting Smarti tokens in message', message._id);
	if (RocketChat.settings.get('Assistify_AI_Smarti_Inline_Highlighting_Enabled')) {
		let { html } = message;
		console.info('Recognized terms', JSON.stringify(recognizedTerms));
		if (recognizedTerms) {
			recognizedTerms.forEach((term) => {
				const regexpFindTerm = `(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${ s.escapeRegExp(term) })($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)`;
				html = html.replace(new RegExp(regexpFindTerm, 'gmi'), '$1<span class="recognized-term"><span class="text">$2</span></span>$3');
				console.info('HTML after term', term, html);
			});
		}
		message.html = html;
	}
};

RocketChat.callbacks.add('renderMessage', highlightRecognizedTerms, RocketChat.callbacks.priority.LOW, 'smartiHighlighting');
