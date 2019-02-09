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
	if (RocketChat.settings.get('Assistify_AI_Smarti_Inline_Highlighting_Enabled')) {
		let { html } = message;
		if (recognizedTerms) {
			recognizedTerms.forEach((term) => {
				const regexpFindTerm = `(^|\\b|[\\s.,،'\\\"\\+!?:-])(${ s.escapeRegExp(term) })($|\\b|[\\s.,،'\\\"\\+!?:-])`;
				html = html.replace(new RegExp(regexpFindTerm, 'gmi'), '$1<span class="recognized-term"><span class="text">$2</span></span>$3');
			});
		}
		message.html = html;
	}
};

RocketChat.callbacks.add('renderMessage', highlightRecognizedTerms, RocketChat.callbacks.priority.LOW, 'smartiHighlighting');
